import { useEffect, useMemo, useState } from 'react'
import { Settings, Plus, RefreshCcw, Send, Shield, Copy, Repeat, X, ChevronRight, Link2, CreditCard, Network } from 'lucide-react'
import { searchAccounts, searchTransactions } from '@/services/ledgerAdapter'

type Psp = 'stripe' | 'adyen'

type ExternalPspAccount = {
  id: string
  psp: Psp
  merchantName: string
  currency: string
  linkedLedgerAccountId?: string
  metadata?: Record<string, any>
  createdAt: string
  lastActivity?: string
}

type MockPaymentInput = {
  psp: Psp
  pspAccountId: string
  amountMinor: number
  currency: string
  description?: string
  customerId?: string
}

type NormalizedEvent = {
  externalPaymentId: string
  pspAccountId: string
  amountMinor: number
  currency: string
  merchantRef?: string
  customerRef?: string
  occurredAt: string
  sourceType: 'stripe_charge' | 'adyen_payment'
  environment?: string
}

type MockPayment = {
  paymentId: string
  createdAt: string
  status: 'succeeded' | 'failed' | 'refunded' | 'pending'
  rawPspEvent: any
  normalizedEvent: NormalizedEvent
  webhookRequest: { url: string; headers: Record<string, string>; body: any }
  webhookResponse?: { status: number; text: string } | { error: string }
}

async function hmacSha256Hex(secret: string, rawBody: string): Promise<string> {
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody))
    const bytes = new Uint8Array(sig)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}

function formatMajor(amountMinor: number, currency: string) {
  const factor = 100
  return `${(amountMinor / factor).toFixed(2)} ${currency}`
}

export function ConnectivityVisualizer() {
  const [ledger, setLedger] = useState('cursor-test')
  const [pspFilter, setPspFilter] = useState<Psp | 'all'>('all')
  const [accounts, setAccounts] = useState<ExternalPspAccount[]>([])
  const [payments, setPayments] = useState<MockPayment[]>([])
  const [tab, setTab] = useState<'overview' | 'accounts' | 'payments' | 'graph'>('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState<string>('https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/payments/connectors/webhooks/adyen/eyJQcm92aWRlciI6ImFkeWVuIiwiUmVmZXJlbmNlIjoiNzgyNDVhNjMtNDJmNi00NzVkLWEyYTMtZDFjNjczNjg2NjI4In0/')
  const [webhookSecret, setWebhookSecret] = useState<string>('')
  const [environment, setEnvironment] = useState<string>('sandbox')
  const [creating, setCreating] = useState<{ account?: boolean; payment?: boolean; seeding?: boolean }>({})
  const [formAccount, setFormAccount] = useState<{ psp: Psp; merchantName: string; currency: string; linkedLedgerAccountId: string }>({ psp: 'stripe', merchantName: '', currency: 'USD', linkedLedgerAccountId: '' })
  const [formPayment, setFormPayment] = useState<{ psp: Psp; pspAccountId: string; amountMajor: string; currency: string; description: string; customerId: string }>({ psp: 'stripe', pspAccountId: '', amountMajor: '10.00', currency: 'USD', description: '', customerId: '' })
  const [selectedAccount, setSelectedAccount] = useState<ExternalPspAccount | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<MockPayment | null>(null)

  const visibleAccounts = useMemo(() => accounts.filter(a => pspFilter === 'all' ? true : a.psp === pspFilter), [accounts, pspFilter])
  const visiblePayments = useMemo(() => payments.filter(p => pspFilter === 'all' ? true : p.normalizedEvent.sourceType.startsWith(pspFilter)), [payments, pspFilter])

  const kpis = useMemo(() => {
    const byPsp: Record<string, { count: number; succeeded: number; refunded: number; amountMinor: number }> = {}
    for (const p of visiblePayments) {
      const key = p.normalizedEvent.sourceType.startsWith('stripe') ? 'stripe' : 'adyen'
      byPsp[key] = byPsp[key] || { count: 0, succeeded: 0, refunded: 0, amountMinor: 0 }
      byPsp[key].count += 1
      if (p.status === 'succeeded') byPsp[key].succeeded += 1
      if (p.status === 'refunded') byPsp[key].refunded += 1
      byPsp[key].amountMinor += p.normalizedEvent.amountMinor
    }
    return byPsp
  }, [visiblePayments])

  const createPspAccount = () => {
    setCreating(c => ({ ...c, account: true }))
    const now = new Date().toISOString()
    const id = `${formAccount.psp === 'stripe' ? 'acct_' : 'ady_'}` + Math.random().toString(36).slice(2, 8)
    const acc: ExternalPspAccount = {
      id,
      psp: formAccount.psp,
      merchantName: formAccount.merchantName || 'Demo Merchant',
      currency: formAccount.currency || 'USD',
      linkedLedgerAccountId: formAccount.linkedLedgerAccountId || undefined,
      metadata: { env: environment },
      createdAt: now,
    }
    setAccounts(prev => [acc, ...prev])
    setCreating(c => ({ ...c, account: false }))
  }

  function buildStripeEvent(input: MockPaymentInput) {
    const id = 'ch_' + Math.random().toString(36).slice(2, 10)
    const created = Math.floor(Date.now() / 1000)
    const raw = {
      id: 'evt_' + Math.random().toString(36).slice(2, 10),
      type: 'charge.succeeded',
      created,
      data: {
        object: {
          id,
          amount: input.amountMinor,
          currency: input.currency.toLowerCase(),
          description: input.description || null,
          metadata: { psp_account: input.pspAccountId, env: environment },
          status: 'succeeded'
        }
      }
    }
    const normalized: NormalizedEvent = {
      externalPaymentId: id,
      pspAccountId: input.pspAccountId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      merchantRef: undefined,
      customerRef: input.customerId,
      occurredAt: new Date(created * 1000).toISOString(),
      sourceType: 'stripe_charge',
      environment
    }
    return { raw, normalized }
  }

  function buildAdyenEvent(input: MockPaymentInput) {
    const pspReference = 'psp_' + Math.random().toString(36).slice(2, 10)
    const raw = {
      eventCode: 'AUTHORISATION',
      success: 'true',
      pspReference,
      merchantAccountCode: input.pspAccountId,
      amount: { value: input.amountMinor, currency: input.currency },
      eventDate: new Date().toISOString(),
      additionalData: { env: environment, customerId: input.customerId || '' }
    }
    const normalized: NormalizedEvent = {
      externalPaymentId: pspReference,
      pspAccountId: input.pspAccountId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      merchantRef: undefined,
      customerRef: input.customerId,
      occurredAt: raw.eventDate,
      sourceType: 'adyen_payment',
      environment
    }
    return { raw, normalized }
  }

  const postWebhook = async (url: string, body: any) => {
    const raw = JSON.stringify(body)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (webhookSecret) {
      const sig = await hmacSha256Hex(webhookSecret, raw)
      if (sig) headers['X-PSP-Signature'] = `sha256=${sig}`
    }
    try {
      const res = await fetch(url, { method: 'POST', headers, body: raw })
      const text = await res.text().catch(() => '')
      return { ok: res.ok, status: res.status, text }
    } catch (e: any) {
      return { ok: false, status: 0, text: e?.message || 'Network error' }
    }
  }

  const createPayment = async () => {
    setCreating(c => ({ ...c, payment: true }))
    const acc = accounts.find(a => a.id === formPayment.pspAccountId)
    if (!acc) { setCreating(c => ({ ...c, payment: false })); return }
    const amountMinor = Math.round(Number(formPayment.amountMajor || '0') * 100)
    const input: MockPaymentInput = {
      psp: formPayment.psp,
      pspAccountId: acc.id,
      amountMinor,
      currency: formPayment.currency || acc.currency || 'USD',
      description: formPayment.description,
      customerId: formPayment.customerId
    }
    const built = input.psp === 'stripe' ? buildStripeEvent(input) : buildAdyenEvent(input)
    const webhookBody = built.raw
    const req = { url: webhookUrl, headers: { 'Content-Type': 'application/json' }, body: webhookBody }
    const resp = await postWebhook(webhookUrl, webhookBody)
    const payment: MockPayment = {
      paymentId: 'pay_' + Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
      status: 'succeeded',
      rawPspEvent: webhookBody,
      normalizedEvent: built.normalized,
      webhookRequest: req,
      webhookResponse: resp.ok ? { status: resp.status, text: resp.text.slice(0, 200) } : { error: resp.text }
    }
    setPayments(prev => [payment, ...prev])
    setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, lastActivity: new Date().toISOString() } : a))
    setCreating(c => ({ ...c, payment: false }))
  }

  const seedData = async () => {
    setCreating(c => ({ ...c, seeding: true }))
    const mkAcc = (psp: Psp, idx: number): ExternalPspAccount => ({
      id: (psp === 'stripe' ? 'acct_' : 'ady_') + Math.random().toString(36).slice(2, 8),
      psp,
      merchantName: `${psp.toUpperCase()} Merchant ${idx}`,
      currency: 'USD',
      metadata: { env: environment },
      createdAt: new Date().toISOString()
    })
    const newAccounts = [mkAcc('stripe', 1), mkAcc('stripe', 2), mkAcc('adyen', 1), mkAcc('adyen', 2)]
    setAccounts(prev => [...newAccounts, ...prev])
    const created: MockPayment[] = []
    for (let i = 0; i < 14; i++) {
      const acc = newAccounts[Math.floor(Math.random() * newAccounts.length)]
      const amountMinor = (5 + Math.floor(Math.random() * 200)) * 100
      const input: MockPaymentInput = { psp: acc.psp, pspAccountId: acc.id, amountMinor, currency: 'USD' }
      const built = acc.psp === 'stripe' ? buildStripeEvent(input) : buildAdyenEvent(input)
      const req = { url: webhookUrl, headers: { 'Content-Type': 'application/json' }, body: built.raw }
      const resp = await postWebhook(webhookUrl, built.raw)
      created.push({
        paymentId: 'pay_' + Math.random().toString(36).slice(2, 10),
        createdAt: new Date().toISOString(),
        status: Math.random() < 0.2 ? 'refunded' : 'succeeded',
        rawPspEvent: built.raw,
        normalizedEvent: built.normalized,
        webhookRequest: req,
        webhookResponse: resp.ok ? { status: resp.status, text: resp.text.slice(0, 200) } : { error: resp.text }
      })
    }
    setPayments(prev => [...created, ...prev])
    setCreating(c => ({ ...c, seeding: false }))
  }

  const resetAll = () => {
    setAccounts([])
    setPayments([])
    setSelectedAccount(null)
    setSelectedPayment(null)
  }

  const resendWebhook = async (p: MockPayment) => {
    const resp = await postWebhook(p.webhookRequest.url, p.webhookRequest.body)
    setPayments(prev => prev.map(x => x.paymentId === p.paymentId ? { ...x, webhookResponse: resp.ok ? { status: resp.status, text: resp.text.slice(0, 200) } : { error: resp.text } } : x))
  }

  const [ledgerDetails, setLedgerDetails] = useState<{ accountId: string; volumes?: any; balances?: Record<string, number>; postings?: any[] } | null>(null)
  useEffect(() => {
    const fetchLedger = async () => {
      if (!selectedAccount?.linkedLedgerAccountId) { setLedgerDetails(null); return }
      const accId = selectedAccount.linkedLedgerAccountId
      try {
        const accs = await searchAccounts(ledger, { address: accId }, true)
        const accountRow = (accs?.cursor?.data || accs?.data || [])[0] || null
        const vols = accountRow?.volumes || null
        const balances: Record<string, number> = {}
        if (vols) {
          Object.keys(vols).forEach(asset => {
            const v = vols[asset]
            if (typeof v?.balance === 'number') balances[asset] = v.balance
            else {
              const i = typeof v?.input === 'number' ? v.input : 0
              const o = typeof v?.output === 'number' ? v.output : 0
              if (i || o) balances[asset] = i - o
            }
          })
        }
        const txs = await searchTransactions(ledger, { $or: [{ source: accId }, { destination: accId }], $sort: { timestamp: 'desc' }, $limit: 10 })
        const postings: any[] = (txs?.cursor?.data || txs?.data || [])
        setLedgerDetails({ accountId: accId, volumes: vols, balances, postings })
      } catch {
        setLedgerDetails({ accountId: accId, balances: {}, postings: [] })
      }
    }
    fetchLedger()
  }, [selectedAccount?.linkedLedgerAccountId, ledger])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/70 backdrop-blur rounded-lg px-4 py-3 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Connectivity Visualizer</h1>
          <span className="text-xs px-2 py-1 rounded border border-emerald-600 text-emerald-300 bg-emerald-900/20">Ledger: {ledger}</span>
          <select className="input h-8" value={pspFilter} onChange={(e) => setPspFilter(e.target.value as any)}>
            <option value="all">All PSPs</option>
            <option value="stripe">Stripe-like</option>
            <option value="adyen">Adyen-like</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input className="input h-8 w-40" value={ledger} onChange={(e) => setLedger(e.target.value)} />
          <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={seedData} disabled={!!creating.seeding}>
            <RefreshCcw className="h-4 w-4" />
            <span>{creating.seeding ? 'Seeding…' : 'Seed sample data'}</span>
          </button>
          <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={resetAll}>
            <X className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button className="btn inline-flex items-center gap-2 px-3 h-9" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Settings</div>
            <button className="text-slate-300 hover:text-white" onClick={() => setSettingsOpen(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Formance Webhook URL</label>
              <input className="input" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="/connectivity/webhooks" />
            </div>
            <div>
              <label className="label">Shared secret (optional)</label>
              <input className="input" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="secret" />
            </div>
            <div>
              <label className="label">Environment tag</label>
              <input className="input" value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="sandbox" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <div className="text-sm font-medium">Actions</div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Create PSP Account</div>
            <div className="grid grid-cols-2 gap-2">
              <select className="input h-9" value={formAccount.psp} onChange={(e) => setFormAccount({ ...formAccount, psp: e.target.value as Psp })}>
                <option value="stripe">Stripe-like</option>
                <option value="adyen">Adyen-like</option>
              </select>
              <input className="input h-9" placeholder="Merchant name" value={formAccount.merchantName} onChange={(e) => setFormAccount({ ...formAccount, merchantName: e.target.value })} />
              <input className="input h-9" placeholder="Currency (ISO)" value={formAccount.currency} onChange={(e) => setFormAccount({ ...formAccount, currency: e.target.value })} />
              <input className="input h-9" placeholder="Linked Ledger Account (optional)" value={formAccount.linkedLedgerAccountId} onChange={(e) => setFormAccount({ ...formAccount, linkedLedgerAccountId: e.target.value })} />
            </div>
            <div className="mt-2">
              <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={createPspAccount} disabled={!!creating.account}>
                <Plus className="h-4 w-4" />
                <span>Create PSP Account</span>
              </button>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Create Payment</div>
            <div className="grid grid-cols-2 gap-2">
              <select className="input h-9" value={formPayment.psp} onChange={(e) => setFormPayment({ ...formPayment, psp: e.target.value as Psp, pspAccountId: '' })}>
                <option value="stripe">Stripe-like</option>
                <option value="adyen">Adyen-like</option>
              </select>
              <select className="input h-9" value={formPayment.pspAccountId} onChange={(e) => setFormPayment({ ...formPayment, pspAccountId: e.target.value })}>
                <option value="">Choose account…</option>
                {accounts.filter(a => a.psp === formPayment.psp).map(a => (
                  <option key={a.id} value={a.id}>{a.psp} • {a.id}</option>
                ))}
              </select>
              <input className="input h-9" placeholder="Amount (major)" value={formPayment.amountMajor} onChange={(e) => setFormPayment({ ...formPayment, amountMajor: e.target.value })} />
              <input className="input h-9" placeholder="Currency" value={formPayment.currency} onChange={(e) => setFormPayment({ ...formPayment, currency: e.target.value })} />
              <input className="input h-9" placeholder="Description" value={formPayment.description} onChange={(e) => setFormPayment({ ...formPayment, description: e.target.value })} />
              <input className="input h-9" placeholder="Customer ID" value={formPayment.customerId} onChange={(e) => setFormPayment({ ...formPayment, customerId: e.target.value })} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={createPayment} disabled={!!creating.payment || !formPayment.pspAccountId}>
                <Send className="h-4 w-4" />
                <span>Create Payment (send webhook)</span>
              </button>
              <button className="btn inline-flex items-center gap-2 px-3 h-9" onClick={seedData}>
                <Repeat className="h-4 w-4" />
                <span>Emit random</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-3">
            <button className={`btn ${tab==='overview'?'btn-primary':''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`btn ${tab==='accounts'?'btn-primary':''}`} onClick={() => setTab('accounts')}>Accounts</button>
            <button className={`btn ${tab==='payments'?'btn-primary':''}`} onClick={() => setTab('payments')}>Payments</button>
            <button className={`btn ${tab==='graph'?'btn-primary':''}`} onClick={() => setTab('graph')}>Graph</button>
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['stripe','adyen'] as Psp[]).map(key => (
                <div key={key} className="p-4 rounded border border-slate-800 bg-slate-900/60">
                  <div className="text-xs text-slate-400">{key.toUpperCase()}</div>
                  <div className="text-lg text-slate-100">{kpis[key]?.count || 0} payments</div>
                  <div className="text-xs text-slate-400">Succeeded: {kpis[key]?.succeeded || 0} • Refunded: {kpis[key]?.refunded || 0}</div>
                  <div className="text-xs text-slate-400">Total: {formatMajor(kpis[key]?.amountMinor || 0, 'USD')}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'accounts' && (
            <div className="max-h-[540px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">psp</th>
                    <th>pspAccountId</th>
                    <th>merchantName</th>
                    <th>currency</th>
                    <th>linkedLedgerAccountId</th>
                    <th>balance</th>
                    <th>lastActivity</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAccounts.map(a => (
                    <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/60 cursor-pointer" onClick={() => setSelectedAccount(a)}>
                      <td className="py-2">{a.psp}</td>
                      <td className="font-mono">{a.id}</td>
                      <td>{a.merchantName}</td>
                      <td>{a.currency}</td>
                      <td className="font-mono text-xs">{a.linkedLedgerAccountId || '—'}</td>
                      <td className="text-xs">{a.linkedLedgerAccountId && ledgerDetails?.accountId === a.linkedLedgerAccountId && ledgerDetails?.balances && Object.keys(ledgerDetails.balances).length>0 ? Object.entries(ledgerDetails.balances).map(([as,bal]) => `${as}: ${bal}`).join(' • ') : '—'}</td>
                      <td className="text-xs">{a.lastActivity ? new Date(a.lastActivity).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedAccount && (
                <div className="mt-3 p-3 rounded border border-slate-800 bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">External account details</div>
                    <button className="text-slate-300 hover:text-white" onClick={() => setSelectedAccount(null)}><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div>
                      <div className="text-xs text-slate-400">Account</div>
                      <div className="font-mono text-slate-100">{selectedAccount.psp} • {selectedAccount.id}</div>
                      <div className="text-xs text-slate-400">Merchant: {selectedAccount.merchantName} • Currency: {selectedAccount.currency}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Linked ledger account</div>
                      <div className="font-mono text-slate-100">{selectedAccount.linkedLedgerAccountId || '—'}</div>
                    </div>
                  </div>
                  {selectedAccount.linkedLedgerAccountId && ledgerDetails && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-2 rounded border border-slate-800">
                        <div className="text-xs text-slate-400 mb-1">Balances</div>
                        <div className="text-xs">
                          {ledgerDetails.balances && Object.keys(ledgerDetails.balances).length>0 ? Object.entries(ledgerDetails.balances).map(([as,bal]) => (
                            <div key={as} className="font-mono">{as}: {bal}</div>
                          )) : '—'}
                        </div>
                      </div>
                      <div className="p-2 rounded border border-slate-800">
                        <div className="text-xs text-slate-400 mb-1">Recent postings</div>
                        <div className="space-y-1 text-xs">
                          {(ledgerDetails.postings || []).map((tx: any) => (
                            <div key={tx.id} className="font-mono text-slate-200">
                              {tx.id} • {(tx.postings||[]).slice(0,3).map((p:any,i:number)=>`${p.source}→${p.destination}[${p.asset} ${p.amount}]`).join('  ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-1">Recent mock payments for this PSP account</div>
                    <div className="space-y-1 text-xs">
                      {payments.filter(p=>p.normalizedEvent.pspAccountId===selectedAccount.id).map(p => (
                        <div key={p.paymentId} className="p-2 rounded border border-slate-800 bg-slate-900/60">
                          <div className="flex items-center justify-between">
                            <div className="font-mono">{p.paymentId} • {p.status} • {formatMajor(p.normalizedEvent.amountMinor, p.normalizedEvent.currency)}</div>
                            <div className="flex items-center gap-2">
                              <button className="btn inline-flex items-center gap-1 h-7 px-2" onClick={() => resendWebhook(p)}>
                                <Repeat className="h-3 w-3"/> Resend webhook
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">Webhook: {p.webhookResponse && 'status' in p.webhookResponse ? `${p.webhookResponse.status}` : (p.webhookResponse && 'error' in p.webhookResponse ? `error` : '—')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'payments' && (
            <div className="max-h-[540px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">psp</th>
                    <th>paymentId</th>
                    <th>pspAccountId</th>
                    <th>status</th>
                    <th>amount</th>
                    <th>currency</th>
                    <th>createdAt</th>
                    <th>webhookStatus</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map(p => (
                    <tr key={p.paymentId} className="border-t border-slate-800 hover:bg-slate-800/60 cursor-pointer" onClick={() => setSelectedPayment(p)}>
                      <td className="py-2">{p.normalizedEvent.sourceType.startsWith('stripe') ? 'stripe' : 'adyen'}</td>
                      <td className="font-mono">{p.paymentId}</td>
                      <td className="font-mono text-xs">{p.normalizedEvent.pspAccountId}</td>
                      <td>{p.status}</td>
                      <td>{(p.normalizedEvent.amountMinor/100).toFixed(2)}</td>
                      <td>{p.normalizedEvent.currency}</td>
                      <td className="text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                      <td className="text-xs">{p.webhookResponse && 'status' in p.webhookResponse ? p.webhookResponse.status : (p.webhookResponse && 'error' in p.webhookResponse ? 'error' : '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedPayment && (
                <div className="mt-3 p-3 rounded border border-slate-800 bg-slate-900/70">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Payment details</div>
                    <button className="text-slate-300 hover:text-white" onClick={() => setSelectedPayment(null)}><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="p-2 rounded border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Raw PSP event</div>
                      <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selectedPayment.rawPspEvent, null, 2)}</pre>
                    </div>
                    <div className="p-2 rounded border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Normalized event</div>
                      <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selectedPayment.normalizedEvent, null, 2)}</pre>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="p-2 rounded border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Webhook request</div>
                      <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selectedPayment.webhookRequest, null, 2)}</pre>
                    </div>
                    <div className="p-2 rounded border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Webhook response</div>
                      <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selectedPayment.webhookResponse || {}, null, 2)}</pre>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="btn inline-flex items-center gap-2 h-9 px-3" onClick={() => resendWebhook(selectedPayment)}>
                      <Repeat className="h-4 w-4"/> Resend webhook
                    </button>
                    <button className="btn inline-flex items-center gap-2 h-9 px-3" onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedPayment.rawPspEvent))}>
                      <Copy className="h-4 w-4"/> Copy payload
                    </button>
                    <button className="btn inline-flex items-center gap-2 h-9 px-3" onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedPayment.normalizedEvent))}>
                      <Copy className="h-4 w-4"/> Copy normalized
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'graph' && (
            <div className="p-4">
              <div className="text-xs text-slate-400 mb-2">PSP → external account → linked ledger account</div>
              <div className="space-y-4">
                {(['stripe','adyen'] as Psp[]).map(psp => (
                  <div key={psp}>
                    <div className="flex items-center gap-2 text-slate-200">
                      <CreditCard className="h-4 w-4"/> {psp.toUpperCase()}
                    </div>
                    <div className="mt-2 ml-6 space-y-2">
                      {accounts.filter(a=>a.psp===psp).map(a => (
                        <div key={a.id} className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-slate-500"/>
                          <span className="font-mono text-slate-100 cursor-pointer hover:underline" onClick={()=>{setPspFilter(psp); setTab('accounts'); setSelectedAccount(a)}}>{a.id}</span>
                          <Link2 className="h-3 w-3 text-slate-500"/>
                          <span className="font-mono text-slate-300 cursor-pointer hover:underline" onClick={()=>{ if (a.linkedLedgerAccountId){ setTab('accounts'); setSelectedAccount(a) } }}>{a.linkedLedgerAccountId || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


