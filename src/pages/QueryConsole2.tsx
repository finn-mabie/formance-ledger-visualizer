import { useEffect, useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'

type PlanIntent = 'metric' | 'list' | 'trend' | 'compare' | 'explain'

// Expanded type for more flexible queries
type QueryResource = 'payments' | 'payouts' | 'accounts' | 'ledger-accounts' | 'transactions' | 'balances' | 'wallets' | 'holds' | 'workflows' | 'triggers'

type Plan = {
  intent: PlanIntent
  entities: Record<string, string>
  time: { from: string; to: string; grain?: 'day' | 'week' | 'month' }
  metrics: string[]
  dimensions: string[]
  filters: Array<{ field: string; op: 'in' | 'eq' | 'ne' | 'gte' | 'lte'; value: any }>
  limit: number
  resources?: QueryResource[]
}

type ApiCall = { method: string; path: string; query?: Record<string, any> }

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

const DEFAULT_LOOKBACK_DAYS = Number(import.meta.env.VITE_QC_DEFAULT_LOOKBACK_DAYS || 30)
const DEFAULT_LEDGER = import.meta.env.VITE_FORMANCE_LEDGER || 'cursor-test'

async function httpGet(path: string, query: Record<string, any> = {}) {
  const q = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.set(k, String(v)) })
  const url = `${path}${q.toString() ? `?${q.toString()}` : ''}`
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || data?.errorMessage || `GET ${url} failed`)
  return data
}

function toCsv(rows: any[], headerOrder?: string[]) {
  if (!rows || rows.length === 0) return ''
  const cols = headerOrder || Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  const lines = [cols.join(',')]
  for (const r of rows) {
    lines.push(cols.map(c => JSON.stringify(r[c] ?? '')).join(','))
  }
  return lines.join('\n')
}

function maskPII(s: string): string {
  if (typeof s !== 'string') return s as any
  // Very basic masking: emails
  return s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '***@***')
}

function normalizePayments(list: any[]): any[] {
  return list.map((p: any) => ({
    id: p.id,
    psp: p.provider || p.connector || p.connectorID || p.providerName || 'unknown',
    merchant_id: p.merchantID || p.merchantId || p.metadata?.merchantId || '',
    amount_minor: p.amount || p.initialAmount || 0,
    currency: (p.asset || p.currency || 'USD').toUpperCase(),
    scheme: p.scheme || p.network || '',
    status: (p.status || '').toUpperCase(),
    created_at: p.createdAt || p.created_at || p.timestamp || new Date().toISOString()
  }))
}

function normalizePayouts(list: any[]): any[] {
  return list.map((p: any) => ({
    id: p.id,
    psp: p.provider || p.connector || p.connectorID || 'unknown',
    source_account_id: p.sourceAccountID || '',
    dest_account_id: p.destinationAccountID || '',
    amount_minor: p.amount || 0,
    currency: (p.asset || p.currency || 'USD').toUpperCase(),
    status: (p.status || '').toUpperCase(),
    created_at: p.createdAt || new Date().toISOString()
  }))
}

export function QueryConsole() {
  const [prompt, setPrompt] = useState('failed payouts yesterday by psp, top 5')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appliedTime, setAppliedTime] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ prompt: string; plan: Plan; ts: string }>>([])

  const today = new Date()
  const fromDefault = new Date(today.getTime() - DEFAULT_LOOKBACK_DAYS * 86400000)

  function buildDefaultTime(): { from: string; to: string } {
    return { from: formatDate(fromDefault), to: formatDate(today) }
  }

  function enhancedPlanner(input: string): Plan {
    const lower = input.toLowerCase()
    let intent: PlanIntent = 'list'
    if (lower.includes('trend') || lower.includes('per day') || lower.includes('daily')) intent = 'trend'
    if (lower.includes('top') || lower.includes('by ')) intent = 'metric'
    if (lower.startsWith('explain balance')) intent = 'explain'
    if (lower.includes('compare')) intent = 'compare'

    // Detect resources
    const resources: QueryResource[] = []
    if (lower.includes('payment') || lower.includes('payin') || lower.includes('pay-in')) resources.push('payments')
    if (lower.includes('payout')) resources.push('payouts')
    if (lower.includes('wallet')) resources.push('wallets')
    if (lower.includes('hold')) resources.push('holds')
    if (lower.includes('workflow') || lower.includes('flow')) resources.push('workflows')
    if (lower.includes('trigger')) resources.push('triggers')
    if (lower.includes('account')) {
      if (lower.includes('ledger') || lower.includes('balance')) resources.push('ledger-accounts')
      else resources.push('accounts')
    }
    if (lower.includes('transaction') || lower.includes('posting')) resources.push('transactions')
    if (resources.length === 0) resources.push('payments') // default

    // time
    let time = buildDefaultTime()
    if (lower.includes('yesterday')) {
      const d = new Date(today.getTime() - 86400000)
      time = { from: formatDate(d), to: formatDate(d) }
      setAppliedTime('Applied: yesterday')
    } else if (lower.includes('last 7')) {
      const d = new Date(today.getTime() - 7 * 86400000)
      time = { from: formatDate(d), to: formatDate(today) }
      setAppliedTime('Applied: last 7d')
    } else if (lower.includes('last 30')) {
      time = buildDefaultTime()
      setAppliedTime('Applied: last 30d')
    } else if (lower.includes('today')) {
      time = { from: formatDate(today), to: formatDate(today) }
      setAppliedTime('Applied: today')
    } else {
      setAppliedTime(`Applied: last ${DEFAULT_LOOKBACK_DAYS}d`)
    }

    const entities: Record<string, string> = {}
    if (lower.includes('stripe')) entities.psp = 'STRIPE'
    if (lower.includes('adyen')) entities.psp = 'ADYEN'
    if (lower.includes('mangopay')) entities.psp = 'MANGOPAY'
    if (lower.includes('modulr')) entities.psp = 'MODULR'
    
    // Extract merchant if mentioned
    const merchantMatch = lower.match(/merchant[_\s]+(\w+)/i)
    if (merchantMatch) entities.merchant_id = merchantMatch[1]
    
    // Extract currency
    const currencyMatch = lower.match(/\b(usd|eur|gbp|jpy|cad|aud)\b/i)
    if (currencyMatch) entities.currency = currencyMatch[1].toUpperCase()

    const metrics: string[] = []
    const dimensions: string[] = []
    const filters: Plan['filters'] = []
    let limit = 200

    // Smart intent detection based on keywords
    if (lower.startsWith('failed payouts yesterday')) {
      intent = 'metric'
      filters.push({ field: 'status', op: 'in', value: ['FAILED'] })
      dimensions.push('psp')
      limit = 5
    }
    else if (lower.includes('payins') && (lower.includes('by currency') || lower.includes('per currency'))) {
      intent = 'metric'
      dimensions.push('currency')
      metrics.push('count_payins', 'sum_amount')
    }
    else if (lower.includes('card volume') || lower.includes('card transactions')) {
      intent = 'metric'
      filters.push({ field: 'scheme', op: 'in', value: ['visa', 'mastercard', 'amex', 'discover'] })
      if (lower.includes('merchant')) dimensions.push('merchant_id')
      else dimensions.push('scheme')
      metrics.push('count', 'sum_amount')
      limit = lower.includes('top') ? 10 : 50
    }
    else if (lower.includes('success rate')) {
      intent = 'metric'
      dimensions.push(lower.includes('psp') ? 'psp' : 'status')
      metrics.push('success_rate')
    }
    else if (lower.startsWith('explain balance for')) {
      intent = 'explain'
      const parts = lower.split('explain balance for')[1].trim()
      const account = parts.split(' as of ')[0].trim()
      entities.account = account
      const datePart = (parts.split(' as of ')[1] || '').trim()
      if (datePart) time = { from: datePart, to: datePart }
    }
    else if (lower.includes('reconciliation') || lower.includes('recon')) {
      intent = 'list'
      resources.push('transactions')
      if (lower.includes('break')) filters.push({ field: 'reconciled', op: 'eq', value: false })
    }
    else if (lower.includes('hold') && lower.includes('wallet')) {
      intent = 'list'
      resources.push('holds')
    }

    // Extract limit if specified
    const limitMatch = lower.match(/top\s+(\d+)|limit\s+(\d+)/i)
    if (limitMatch) limit = parseInt(limitMatch[1] || limitMatch[2])

    return { intent, entities, time, metrics, dimensions, filters, limit, resources }
  }

  async function executeQuery(p: Plan) {
    const calls: ApiCall[] = []
    const collected: any[] = []
    let summaryText = ''

    try {
      setError(null)
      setRows([])
      setApiCalls([])
      setLoading(true)

      // Resource-based routing
      const resources = p.resources || ['payments']
      
      if (p.intent === 'explain' && p.entities.account) {
        // Explain balance - get transactions for account
        const ledger = DEFAULT_LEDGER
        const path = `/api/ledger/${encodeURIComponent(ledger)}/transactions`
        const query: any = { pageSize: 500 }
        calls.push({ method: 'GET', path, query })
        const list = await httpGet(path, query)
        const txs = (list?.cursor?.data || list?.data || []) as any[]
        const postings: any[] = []
        for (const t of txs) {
          const ts = new Date(t.timestamp || t.createdAt)
          if (p.time.to && ts > new Date(p.time.to + 'T23:59:59Z')) continue
          for (const ptx of (t.postings || [])) {
            if (ptx.source === p.entities.account || ptx.destination === p.entities.account) {
              postings.push({
                txn_ref: t.reference || t.id,
                debit: ptx.destination,
                credit: ptx.source,
                amount_minor: ptx.amount,
                asset: ptx.asset,
                ts: t.timestamp || t.createdAt
              })
            }
          }
          if (postings.length >= 100) break
        }
        collected.push(...postings.slice(0, p.limit))
        const net = postings.reduce((acc, r) => acc + (r.debit === p.entities.account ? r.amount_minor : -r.amount_minor), 0)
        summaryText = `As of ${p.time.to}, net balance change for ${p.entities.account} is ${(net/100).toFixed(2)} (units of minor). Showing last ${postings.length} postings.`
      }
      else if (resources.includes('payouts')) {
        // List or aggregate payouts
        const path = `/api/payments/v3/payouts`
        const query: any = { 
          pageSize: Math.min(p.limit, 500),
          ...(p.time.from && { createdAtFrom: p.time.from }),
          ...(p.time.to && { createdAtTo: p.time.to })
        }
        
        // Apply filters
        p.filters.forEach(f => {
          if (f.field === 'status' && f.op === 'in') query.status = f.value[0]
          if (f.field === 'provider' && f.op === 'eq') query.provider = f.value
        })
        
        calls.push({ method: 'GET', path, query })
        const list = await httpGet(path, query)
        const data = normalizePayouts(list?.cursor?.data || list?.data || [])
        
        if (p.intent === 'metric' && p.dimensions.length > 0) {
          // Group by dimensions
          const grouped = Object.values(data.reduce((acc: any, r: any) => {
            const key = p.dimensions.map(d => r[d] || 'unknown').join('_')
            if (!acc[key]) {
              acc[key] = {}
              p.dimensions.forEach(d => acc[key][d] = r[d] || 'unknown')
              acc[key].count = 0
              acc[key].total_amount = 0
            }
            acc[key].count += 1
            acc[key].total_amount += Number(r.amount_minor || 0)
            return acc
          }, {})).sort((a: any, b: any) => b.count - a.count).slice(0, p.limit)
          collected.push(...grouped)
          summaryText = `Top ${grouped.length} ${p.dimensions.join(', ')} by payouts from ${p.time.from} to ${p.time.to}.`
        } else {
          collected.push(...data.slice(0, p.limit))
          summaryText = `Showing ${data.length} payouts from ${p.time.from} to ${p.time.to}.`
        }
      }
      else if (resources.includes('wallets')) {
        // List wallets
        const path = `/api/wallets/v1/wallets`
        const query: any = { pageSize: p.limit }
        calls.push({ method: 'GET', path, query })
        try {
          const list = await httpGet(path, query)
          const data = (list?.cursor?.data || list?.data || []) as any[]
          collected.push(...data.slice(0, p.limit))
          summaryText = `Found ${data.length} wallets.`
        } catch (e) {
          throw new Error('Wallets API not available in this environment')
        }
      }
      else if (resources.includes('holds') && p.entities.wallet_id) {
        // List holds for a wallet
        const path = `/api/wallets/v1/wallets/${p.entities.wallet_id}/holds`
        const query: any = { pageSize: p.limit }
        calls.push({ method: 'GET', path, query })
        const list = await httpGet(path, query)
        const data = (list?.cursor?.data || list?.data || []) as any[]
        collected.push(...data.slice(0, p.limit))
        summaryText = `Found ${data.length} holds for wallet ${p.entities.wallet_id}.`
      }
      else if (resources.includes('workflows')) {
        // List workflows from orchestration
        const path = `/api/orchestration/v2/workflows`
        const query: any = { pageSize: p.limit }
        calls.push({ method: 'GET', path, query })
        const list = await httpGet(path, query)
        const data = (list?.cursor?.data || list?.data || []) as any[]
        collected.push(...data.slice(0, p.limit))
        summaryText = `Found ${data.length} workflows.`
      }
      else if (resources.includes('triggers')) {
        // List triggers from orchestration
        const path = `/api/orchestration/v2/triggers`
        const query: any = { pageSize: p.limit }
        calls.push({ method: 'GET', path, query })
        const list = await httpGet(path, query)
        const data = (list?.cursor?.data || list?.data || []) as any[]
        collected.push(...data.slice(0, p.limit))
        summaryText = `Found ${data.length} triggers.`
      } else {
        // Default: payments/payins
        const path = `/api/payments/v3/payments`
        const query: any = { 
          pageSize: Math.min(p.limit * 2, 1000), // Fetch more for client-side filtering
          ...(p.time.from && { createdAtFrom: p.time.from }),
          ...(p.time.to && { createdAtTo: p.time.to })
        }
        
        // Apply entity filters
        if (p.entities.psp) query.provider = p.entities.psp
        if (p.entities.currency) query.asset = p.entities.currency
        
        // Apply explicit filters
        p.filters.forEach(f => {
          if (f.field === 'status' && f.op === 'in') query.status = f.value[0]
          if (f.field === 'scheme' && f.op === 'in') {
            // Client-side filter for scheme
          }
        })
        
        calls.push({ method: 'GET', path, query })
        const list = await httpGet(path, query)
        let data = normalizePayments(list?.cursor?.data || list?.data || [])
        
        // Client-side scheme filter if needed
        const schemeFilter = p.filters.find(f => f.field === 'scheme')
        if (schemeFilter && schemeFilter.op === 'in') {
          data = data.filter(d => schemeFilter.value.includes(d.scheme.toLowerCase()))
        }
        
        if (p.intent === 'metric' && p.dimensions.length > 0) {
          // Group by dimensions
          const grouped = Object.values(data.reduce((acc: any, r: any) => {
            const key = p.dimensions.map(d => r[d] || 'unknown').join('_')
            if (!acc[key]) {
              acc[key] = {}
              p.dimensions.forEach(d => acc[key][d] = r[d] || 'unknown')
              acc[key].count = 0
              acc[key].total_amount = 0
              acc[key].succeeded = 0
              acc[key].failed = 0
            }
            acc[key].count += 1
            acc[key].total_amount += Number(r.amount_minor || 0)
            if (r.status === 'SUCCEEDED') acc[key].succeeded += 1
            if (r.status === 'FAILED') acc[key].failed += 1
            return acc
          }, {}))
          
          // Calculate success rate if requested
          if (p.metrics.includes('success_rate')) {
            grouped.forEach((g: any) => {
              g.success_rate = g.count > 0 ? ((g.succeeded / g.count) * 100).toFixed(1) + '%' : '0%'
            })
          }
          
          const sorted = grouped.sort((a: any, b: any) => b.count - a.count).slice(0, p.limit)
          collected.push(...sorted)
          summaryText = `${p.dimensions.join(', ')} breakdown from ${p.time.from} to ${p.time.to}. Total: ${data.length} payments.`
        } else {
          collected.push(...data.slice(0, p.limit))
          summaryText = `Showing ${Math.min(data.length, p.limit)} of ${data.length} payments from ${p.time.from} to ${p.time.to}.`
        }
      }

      setApiCalls(calls)
      setRows(collected.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k, typeof v === 'string' ? maskPII(v) : v]))))
      setSummary(summaryText)
      setHistory(prev => [{ prompt, plan: p, ts: new Date().toISOString() }, ...prev].slice(0, 20))
    } catch (e: any) {
      setError(e.message || 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/70 backdrop-blur rounded-lg px-4 py-3 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Query Console</h1>
          {appliedTime && <span className="text-xs px-2 py-1 rounded border border-emerald-600 text-emerald-300 bg-emerald-900/20">{appliedTime}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => {
            if (!rows || rows.length === 0) return
            const csv = toCsv(rows)
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
            const ts = new Date().toISOString().replace(/[-:T]/g,'').slice(0, 12)
            a.download = `qc_${plan?.intent || 'list'}_${ts}.csv`
            a.click()
          }}>Download CSV</button>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <input className="input h-10 flex-1" value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Ask a question" />
          <button className="btn-primary h-10 px-4" onClick={() => { const p = enhancedPlanner(prompt); setPlan(p); executeQuery(p) }} disabled={loading}>
            {loading ? 'Running...' : 'Run'}
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded bg-red-900/20 border border-red-800">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <div className="text-sm text-red-400">{error}</div>
          </div>
        )}
        {plan && (
          <details className="mt-2">
            <summary className="cursor-pointer text-slate-300">Plan</summary>
            <pre className="text-xs mt-2 p-2 rounded border border-slate-800 bg-slate-900/60">{JSON.stringify(plan, null, 2)}</pre>
            <div className="mt-2 text-xs text-slate-400">API calls:</div>
            <ul className="text-xs list-disc ml-6">
              {apiCalls.map((c, i) => (
                <li key={i}><span className="font-mono">{c.method} {c.path}</span>{c.query ? ` ? ${new URLSearchParams(Object.entries(c.query).map(([k,v]) => [k, String(v)])).toString()}` : ''}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <div className="text-sm text-slate-400">No results.</div>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  {Object.keys(rows[0]).map(k => <th key={k} className="py-2">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-800">
                    {Object.keys(rows[0]).map(k => <td key={k} className="py-2 text-xs">{String(r[k])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {summary && <div className="mt-2 text-xs text-slate-300">{summary}</div>}
      </div>

      <div className="card">
        <div className="text-sm font-medium mb-2">Presets</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={()=>{const q='failed payouts yesterday by psp, top 5'; setPrompt(q); const p=enhancedPlanner(q); setPlan(p); executeQuery(p)}}>Failed payouts yesterday</button>
          <button className="btn" onClick={()=>{const q='payins by currency last 7 days'; setPrompt(q); const p=enhancedPlanner(q); setPlan(p); executeQuery(p)}}>Payins by currency (7d)</button>
          <button className="btn" onClick={()=>{const q='explain balance for users:alice as of 2025-09-01'; setPrompt(q); const p=enhancedPlanner(q); setPlan(p); executeQuery(p)}}>Explain balance</button>
          <button className="btn" onClick={()=>{const q='top 10 merchants by card volume last 30 days'; setPrompt(q); const p=enhancedPlanner(q); setPlan(p); executeQuery(p)}}>Top merchants by card volume</button>
          <button className="btn" onClick={()=>{const q='payment success rate by psp last 7 days'; setPrompt(q); const p=enhancedPlanner(q); setPlan(p); executeQuery(p)}}>Success rate by PSP</button>
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-medium mb-2">History</div>
        <div className="space-y-2">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="text-xs text-slate-300">{h.prompt}</div>
              <button className="btn h-7 px-2" onClick={()=>{setPrompt(h.prompt); setPlan(h.plan); executeQuery(h.plan)}}>Re-run</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
