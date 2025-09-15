import { useEffect, useMemo, useState } from 'react'
import { Settings, Plus, RefreshCcw, Send, Copy, Repeat, X, ChevronRight, Link2, CreditCard } from 'lucide-react'
import { searchAccounts, searchTransactions } from '@/services/ledgerAdapter'

type Psp = 'payments'

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
  pspAccountId: string
  amountMinor: number
  currency: string
  description?: string
}

type NormalizedEvent = {
  externalPaymentId: string
  pspAccountId: string
  amountMinor: number
  currency: string
  merchantRef?: string
  customerRef?: string
  occurredAt: string
  sourceType: 'formance_payment'
  environment?: string
}

type MockPayment = {
  paymentId: string
  createdAt: string
  status: 'succeeded' | 'failed' | 'refunded' | 'pending'
  rawPspEvent: any
  normalizedEvent: NormalizedEvent
}

// no-op placeholder for removed webhook logic

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
  const [environment, setEnvironment] = useState<string>('sandbox')
  const [creating, setCreating] = useState<{ account?: boolean; payment?: boolean; seeding?: boolean }>({})
  const [ledgerRefreshNonce, setLedgerRefreshNonce] = useState(0)
  const [formAccount, setFormAccount] = useState<{ merchantName: string; currency: string; linkedLedgerAccountId: string }>({ merchantName: '', currency: 'USD', linkedLedgerAccountId: '' })
  const [formPayment, setFormPayment] = useState<{ pspAccountId: string; amountMajor: string; currency: string; description: string }>({ pspAccountId: '', amountMajor: '10.00', currency: 'USD', description: '' })
  const [selectedAccount, setSelectedAccount] = useState<ExternalPspAccount | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<MockPayment | null>(null)

  const visibleAccounts = useMemo(() => accounts, [accounts])
  const visiblePayments = useMemo(() => payments, [payments])

  const kpis = useMemo(() => {
    const totals = { count: 0, succeeded: 0, refunded: 0, amountMinor: 0 }
    for (const p of visiblePayments) {
      totals.count += 1
      if (p.status === 'succeeded') totals.succeeded += 1
      if (p.status === 'refunded') totals.refunded += 1
      totals.amountMinor += p.normalizedEvent.amountMinor
    }
    return totals
  }, [visiblePayments])

  const api = {
    get: async (url: string) => (await fetch(url)).json(),
    post: async (url: string, body: any) => (await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json()
  }

  const loadPaymentsAccounts = async () => {
    try {
      const list = await api.get('/api/payments/v3/accounts')
      const data = (list?.cursor?.data || []) as any[]
      const mapped: ExternalPspAccount[] = data.map((acc: any) => ({
        id: acc.id,
        psp: 'payments',
        merchantName: acc.name || acc.accountName || acc.reference || 'External account',
        currency: (acc.defaultAsset || 'USD').toUpperCase(),
        metadata: acc.metadata || {},
        createdAt: acc.createdAt || new Date().toISOString()
      }))
      setAccounts(mapped)
    } catch {}
  }

  const loadPayments = async () => {
    try {
      const list = await api.get('/api/payments/v3/payments')
      const data = (list?.cursor?.data || []) as any[]
      const mapped: MockPayment[] = data.map((p: any) => ({
        paymentId: p.id || p.reference || Math.random().toString(36).slice(2,10),
        createdAt: p.createdAt || new Date().toISOString(),
        status: (p.status || 'succeeded').toLowerCase(),
        rawPspEvent: p,
        normalizedEvent: {
          externalPaymentId: p.id || p.reference || 'payment',
          pspAccountId: p.destinationAccountID || p.sourceAccountID || '',
          amountMinor: p.amount || p.initialAmount || 0,
          currency: (p.asset || 'USD').toUpperCase(),
          occurredAt: p.createdAt || new Date().toISOString(),
          sourceType: 'formance_payment',
          environment
        }
      }))
      setPayments(mapped)
    } catch {}
  }

  useEffect(() => { loadPaymentsAccounts(); loadPayments() }, [])

  const createPspAccount = async () => {
    setCreating(c => ({ ...c, account: true }))
    try {
      const now = new Date().toISOString()
      const body: any = {
        reference: 'acct_' + Math.random().toString(36).slice(2,8),
        createdAt: now,
        accountName: formAccount.merchantName || 'Demo Merchant',
        type: 'EXTERNAL',
        defaultAsset: (formAccount.currency || 'USD').toUpperCase(),
        metadata: formAccount.linkedLedgerAccountId ? { linkedLedgerAccountId: formAccount.linkedLedgerAccountId } : {}
      }
      const acc = await api.post('/api/payments/v3/accounts', body)
      const row = acc?.data || acc
      const mapped: ExternalPspAccount = {
        id: row.id,
        psp: 'payments',
        merchantName: row.name || row.accountName || row.reference || body.accountName,
        currency: (row.defaultAsset || body.defaultAsset || 'USD').toUpperCase(),
        linkedLedgerAccountId: formAccount.linkedLedgerAccountId || undefined,
        metadata: row.metadata || {},
        createdAt: row.createdAt || now
      }
      setAccounts(prev => [mapped, ...prev])
    } catch {} finally {
      setCreating(c => ({ ...c, account: false }))
    }
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

  const refreshFromLedger = () => setLedgerRefreshNonce(n => n + 1)

  const createPayment = async () => {
    setCreating(c => ({ ...c, payment: true }))
    try {
      const acc = accounts.find(a => a.id === formPayment.pspAccountId)
      if (!acc) { setCreating(c => ({ ...c, payment: false })); return }
      const amountMinor = Math.round(Number(formPayment.amountMajor || '0') * 100)
      const now = new Date().toISOString()
      const body: any = {
        reference: 'pay_' + Math.random().toString(36).slice(2,10),
        createdAt: now,
        type: 'PAY-IN',
        initialAmount: amountMinor,
        amount: amountMinor,
        asset: (formPayment.currency || acc.currency || 'USD').toUpperCase(),
        destinationAccountID: acc.id,
        metadata: formPayment.description ? { description: formPayment.description } : {}
      }
      const created = await api.post('/api/payments/v3/payments', body)
      const row = created?.data || created
      const payment: MockPayment = {
        paymentId: row.id || body.reference,
        createdAt: row.createdAt || now,
        status: (row.status || 'succeeded').toLowerCase(),
        rawPspEvent: row,
        normalizedEvent: {
          externalPaymentId: row.id || body.reference,
          pspAccountId: acc.id,
          amountMinor,
          currency: body.asset,
          occurredAt: row.createdAt || now,
          sourceType: 'formance_payment',
          environment
        }
      }
      setPayments(prev => [payment, ...prev])
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, lastActivity: now } : a))
    } catch {} finally {
      setCreating(c => ({ ...c, payment: false }))
    }
  }

  const seedData = async () => {
    setCreating(c => ({ ...c, seeding: true }))
    try {
      const now = new Date().toISOString()
      const acc1 = await api.post('/api/payments/v3/accounts', { reference: 'seed_acct_1', createdAt: now, accountName: 'Merchant USD', type: 'EXTERNAL', defaultAsset: 'USD' })
      const acc2 = await api.post('/api/payments/v3/accounts', { reference: 'seed_acct_2', createdAt: now, accountName: 'Merchant EUR', type: 'EXTERNAL', defaultAsset: 'EUR' })
      const a1 = acc1?.data || acc1
      const a2 = acc2?.data || acc2
      const mapped1: ExternalPspAccount = { id: a1.id, psp: 'payments', merchantName: 'Merchant USD', currency: 'USD', createdAt: a1.createdAt || now }
      const mapped2: ExternalPspAccount = { id: a2.id, psp: 'payments', merchantName: 'Merchant EUR', currency: 'EUR', createdAt: a2.createdAt || now }
      setAccounts(prev => [mapped1, mapped2, ...prev])
      const accs = [mapped1, mapped2]
      const createdList: MockPayment[] = []
      const n = 8
      for (let i = 0; i < n; i++) {
        const acc = accs[i % accs.length]
        const amountMinor = (5 + Math.floor(Math.random() * 200)) * 100
        const row = await api.post('/api/payments/v3/payments', { reference: 'seed_'+i, createdAt: new Date().toISOString(), type: 'PAY-IN', initialAmount: amountMinor, amount: amountMinor, asset: acc.currency, destinationAccountID: acc.id })
        const pr = row?.data || row
        createdList.push({
          paymentId: pr.id || 'seed_'+i,
          createdAt: pr.createdAt || new Date().toISOString(),
          status: (pr.status || 'succeeded').toLowerCase(),
          rawPspEvent: pr,
          normalizedEvent: { externalPaymentId: pr.id || 'seed_'+i, pspAccountId: acc.id, amountMinor, currency: acc.currency, occurredAt: pr.createdAt || new Date().toISOString(), sourceType: 'formance_payment', environment }
        })
      }
      setPayments(prev => [...createdList, ...prev])
    } catch {} finally {
      setCreating(c => ({ ...c, seeding: false }))
    }
  }

  const resetAll = () => {
    setAccounts([])
    setPayments([])
    setSelectedAccount(null)
    setSelectedPayment(null)
  }

  const resendWebhook = async (_p: MockPayment) => {}

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
          <div className="text-xs text-slate-400">Formance syncs Payments; click Refresh to update ledger.</div>
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
          <button className="btn inline-flex items-center gap-2 px-3 h-9" onClick={() => setLedgerRefreshNonce(n=>n+1)}>
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh from ledger</span>
          </button>
        </div>
      </div>

      {settingsOpen && null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <div className="text-sm font-medium">Actions</div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Create External Account (Payments)</div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input h-9" placeholder="Merchant name" value={formAccount.merchantName} onChange={(e) => setFormAccount({ ...formAccount, merchantName: e.target.value })} />
              <input className="input h-9" placeholder="Currency (ISO)" value={formAccount.currency} onChange={(e) => setFormAccount({ ...formAccount, currency: e.target.value })} />
              <input className="input h-9" placeholder="Linked Ledger Account (optional)" value={formAccount.linkedLedgerAccountId} onChange={(e) => setFormAccount({ ...formAccount, linkedLedgerAccountId: e.target.value })} />
            </div>
            <div className="mt-2">
              <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={createPspAccount} disabled={!!creating.account}>
                <Plus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Create Payment (Payments v3)</div>
            <div className="grid grid-cols-2 gap-2">
              <select className="input h-9" value={formPayment.pspAccountId} onChange={(e) => setFormPayment({ ...formPayment, pspAccountId: e.target.value })}>
                <option value="">Choose account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.psp} • {a.id}</option>
                ))}
              </select>
              <input className="input h-9" placeholder="Amount (major)" value={formPayment.amountMajor} onChange={(e) => setFormPayment({ ...formPayment, amountMajor: e.target.value })} />
              <input className="input h-9" placeholder="Currency" value={formPayment.currency} onChange={(e) => setFormPayment({ ...formPayment, currency: e.target.value })} />
              <input className="input h-9" placeholder="Description" value={formPayment.description} onChange={(e) => setFormPayment({ ...formPayment, description: e.target.value })} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={createPayment} disabled={!!creating.payment || !formPayment.pspAccountId}>
                <Send className="h-4 w-4" />
                <span>Create Payment</span>
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
              <div className="p-4 rounded border border-slate-800 bg-slate-900/60">
                <div className="text-xs text-slate-400">Payments</div>
                <div className="text-lg text-slate-100">{kpis.count} payments</div>
                <div className="text-xs text-slate-400">Succeeded: {kpis.succeeded} • Refunded: {kpis.refunded}</div>
                <div className="text-xs text-slate-400">Total: {formatMajor(kpis.amountMinor, 'USD')}</div>
              </div>
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
                    
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map(p => (
                    <tr key={p.paymentId} className="border-t border-slate-800 hover:bg-slate-800/60 cursor-pointer" onClick={() => setSelectedPayment(p)}>
                      <td className="py-2">payments</td>
                      <td className="font-mono">{p.paymentId}</td>
                      <td className="font-mono text-xs">{p.normalizedEvent.pspAccountId}</td>
                      <td>{p.status}</td>
                      <td>{(p.normalizedEvent.amountMinor/100).toFixed(2)}</td>
                      <td>{p.normalizedEvent.currency}</td>
                      <td className="text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                      
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
                      <div className="text-xs text-slate-400 mb-1">Event (raw)</div>
                      <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selectedPayment.rawPspEvent, null, 2)}</pre>
                    </div>
                    <div className="p-2 rounded border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Normalized</div>
                      <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(selectedPayment.normalizedEvent, null, 2)}</pre>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
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


