import { useEffect, useMemo, useState } from 'react'
import { Settings, Plus, RefreshCcw, Send, Copy, Repeat, X, ChevronRight, Link2, CreditCard } from 'lucide-react'
import { LiveAPIMonitor } from '@/components/LiveAPIMonitor'
import { searchAccounts, searchTransactions } from '@/services/ledgerAdapter'
import { getPaymentsApi, postPaymentsApi } from '@/services/paymentsAdapter'

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
  reference?: string
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
  const [tab, setTab] = useState<'overview' | 'payments' | 'accounts'>('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [environment, setEnvironment] = useState<string>('sandbox')
  const [creating, setCreating] = useState<{ account?: boolean; payment?: boolean; seeding?: boolean }>({})
  const [ledgerRefreshNonce, setLedgerRefreshNonce] = useState(0)
  const [formAccount, setFormAccount] = useState<{ accountName: string; defaultAsset: string; type: string }>({ accountName: '', defaultAsset: 'USD/2', type: 'INTERNAL' })
  const [formPayment, setFormPayment] = useState<{ type: string; amount: string; asset: string; sourceAccountID: string; destinationAccountID: string }>({ type: 'PAY-IN', amount: '100', asset: 'USD/2', sourceAccountID: '', destinationAccountID: '' })
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
    get: getPaymentsApi,
    post: postPaymentsApi
  }

  const [connectorId] = useState<string>('eyJQcm92aWRlciI6ImdlbmVyaWMiLCJSZWZlcmVuY2UiOiIxYWRlNWMzZC01NTIxLTRiYzAtYjY4OS01YmY1NzQ0MTA3ODIifQ')

  // Connector ID is fixed per requirements; skip auto-discovery
  const loadConnectors = async () => {}

  const getMostRecentBalance = async (accountId: string): Promise<{ asset: string; balance: number } | null> => {
    try {
      const res = await api.get(`/api/payments/v3/accounts/${encodeURIComponent(accountId)}/balances`)
      const rows = (res?.cursor?.data || res?.data || []) as any[]
      if (!rows.length) return null
      // Sort by lastUpdatedAt (most recent first)
      rows.sort((a, b) => new Date(b.lastUpdatedAt || b.createdAt || 0).getTime() - new Date(a.lastUpdatedAt || a.createdAt || 0).getTime())
      const mostRecent = rows[0]
      return { asset: mostRecent.asset, balance: mostRecent.balance }
    } catch (err) {
      return null
    }
  }

  const loadPaymentsAccounts = async () => {
    try {
      const list = await api.get('/api/payments/v3/accounts?pageSize=100')
      const data = (list?.cursor?.data || []) as any[]
      const mapped: ExternalPspAccount[] = await Promise.all(
        data.map(async (acc: any) => {
          const latest = await getMostRecentBalance(acc.id)
          return {
            id: acc.id,
            psp: 'payments',
            merchantName: acc.accountName || acc.name || acc.reference || 'External account',
            currency: (acc.defaultAsset || 'USD').toUpperCase(),
            metadata: acc.metadata || {},
            createdAt: acc.createdAt || new Date().toISOString(),
            reference: acc.reference,
            ...(latest ? { __latestBalance: latest } as any : {})
          }
        })
      )
      setAccounts(mapped)
    } catch {}
  }

  const loadPayments = async () => {
    try {
      const list = await api.get('/api/payments/v3/payments?pageSize=100')
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

  useEffect(() => { loadConnectors(); loadPaymentsAccounts(); loadPayments() }, [])

  const createPspAccount = async () => {
    setCreating(c => ({ ...c, account: true }))
    try {
      const now = new Date().toISOString()
      const reference = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? (crypto as any).randomUUID() : 'acct_' + Math.random().toString(36).slice(2,10)
      const body: any = {
        reference,
        connectorID: connectorId,
        createdAt: now,
        accountName: formAccount.accountName || 'root',
        type: formAccount.type || 'INTERNAL',
        defaultAsset: formAccount.defaultAsset || 'USD/2',
        metadata: {}
      }
      const acc = await api.post('/api/payments/v3/accounts', body)
      const row = acc?.data || acc
      const mapped: ExternalPspAccount = {
        id: row.id,
        psp: 'payments',
        merchantName: row.accountName || row.name || row.reference || body.accountName,
        currency: (row.defaultAsset || body.defaultAsset || 'USD').toUpperCase(),
        metadata: row.metadata || {},
        createdAt: row.createdAt || now,
        reference: row.reference || reference
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
      const amountMinor = parseInt(formPayment.amount || '0', 10) || 0
      const now = new Date().toISOString()
      const reference = 'txn_' + Math.random().toString(36).slice(2,10)
      const body: any = {
        reference,
        connectorID: connectorId,
        createdAt: now,
        type: formPayment.type || 'PAY-IN',
        initialAmount: amountMinor,
        amount: amountMinor,
        asset: formPayment.asset || 'USD/2',
        status: 'SUCCEEDED',
        scheme: 'CARD_VISA',
        metadata: {},
        sourceAccountID: formPayment.sourceAccountID || null,
        destinationAccountID: formPayment.destinationAccountID || null,
        adjustments: [
          {
            reference: 'adj_001',
            createdAt: now,
            status: 'SUCCEEDED',
            amount: amountMinor,
            asset: formPayment.asset || 'USD/2',
            metadata: {}
          }
        ]
      }
      const created = await api.post('/api/payments/v3/payments', body)
      const row = created?.data || created
      const payment: MockPayment = {
        paymentId: row.id || reference,
        createdAt: row.createdAt || now,
        status: (row.status || 'succeeded').toLowerCase(),
        rawPspEvent: row,
        normalizedEvent: {
          externalPaymentId: row.id || reference,
          pspAccountId: row.destinationAccountID || row.sourceAccountID || '',
          amountMinor: amountMinor,
          currency: (body.asset || 'USD/2').toUpperCase(),
          occurredAt: row.createdAt || now,
          sourceType: 'formance_payment',
          environment
        }
      }
      setPayments(prev => [payment, ...prev])
    } catch {} finally {
      setCreating(c => ({ ...c, payment: false }))
    }
  }

  const seedData = async () => {
    setCreating(c => ({ ...c, seeding: true }))
    try {
      const now = new Date().toISOString()
      const acc1 = await api.post('/api/payments/v3/accounts', { reference: 'seed_acct_1', createdAt: now, accountName: 'Merchant USD', type: 'EXTERNAL', defaultAsset: 'USD', connectorID: connectorId })
      const acc2 = await api.post('/api/payments/v3/accounts', { reference: 'seed_acct_2', createdAt: now, accountName: 'Merchant EUR', type: 'EXTERNAL', defaultAsset: 'EUR', connectorID: connectorId })
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
        const row = await api.post('/api/payments/v3/payments', { reference: 'seed_'+i, createdAt: new Date().toISOString(), type: 'PAY-IN', initialAmount: amountMinor, amount: amountMinor, asset: acc.currency, destinationAccountID: acc.id, connectorID: connectorId })
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
            <div className="text-xs text-slate-400 mb-1">Create Account (Payments v3)</div>
            <div className="grid grid-cols-2 gap-2">
              <input className="input h-9" placeholder="account name" value={formAccount.accountName} onChange={(e) => setFormAccount({ ...formAccount, accountName: e.target.value })} />
              <input className="input h-9" placeholder="defaultAsset (e.g., USD/2)" value={formAccount.defaultAsset} onChange={(e) => setFormAccount({ ...formAccount, defaultAsset: e.target.value })} />
              <select className="input h-9" value={formAccount.type} onChange={(e) => setFormAccount({ ...formAccount, type: e.target.value })}>
                <option value="INTERNAL">INTERNAL</option>
                <option value="EXTERNAL">EXTERNAL</option>
              </select>
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
              <select className="input h-9" value={formPayment.type} onChange={(e) => setFormPayment({ ...formPayment, type: e.target.value })}>
                <option value="PAY-IN">PAY-IN</option>
                <option value="PAYOUT">PAYOUT</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
              <input className="input h-9" placeholder="amount (minor units)" value={formPayment.amount} onChange={(e) => setFormPayment({ ...formPayment, amount: e.target.value })} />
              <input className="input h-9" placeholder="asset (e.g., USD/2)" value={formPayment.asset} onChange={(e) => setFormPayment({ ...formPayment, asset: e.target.value })} />
              <select className="input h-9" value={formPayment.sourceAccountID} onChange={(e) => setFormPayment({ ...formPayment, sourceAccountID: e.target.value })}>
                <option value="">Choose source account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.merchantName || a.reference || a.id}</option>
                ))}
              </select>
              <select className="input h-9" value={formPayment.destinationAccountID} onChange={(e) => setFormPayment({ ...formPayment, destinationAccountID: e.target.value })}>
                <option value="">Choose destination account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.merchantName || a.reference || a.id}</option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={createPayment} disabled={!!creating.payment || !formPayment.type || !formPayment.amount || !formPayment.asset || !formPayment.sourceAccountID || !formPayment.destinationAccountID}>
                <Send className="h-4 w-4" />
                <span>Create Payment</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-3">
            <button className={`btn ${tab==='overview'?'btn-primary':''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`btn ${tab==='payments'?'btn-primary':''}`} onClick={() => setTab('payments')}>Payments</button>
            <button className={`btn ${tab==='accounts'?'btn-primary':''}`} onClick={() => { setTab('accounts'); loadPaymentsAccounts() }}>Accounts</button>
          </div>

          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-slate-800 bg-slate-900/60">
                <div className="text-xs text-slate-400">Payments</div>
                <div className="text-lg text-slate-100">{kpis.count} payments</div>
                <div className="text-xs text-slate-400">Succeeded: {kpis.succeeded} • Refunded: {kpis.refunded}</div>
                <div className="text-xs text-slate-400">Total: {formatMajor(kpis.amountMinor, 'USD')}</div>
              </div>
              <div className="p-4 rounded border border-slate-800 bg-slate-900/60">
                <div className="text-xs text-slate-400">Accounts</div>
                <div className="text-lg text-slate-100">{accounts.length} accounts</div>
              </div>
            </div>
          )}

          {tab === 'accounts' && (
            <div className="max-h-[540px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">id</th>
                    <th>name</th>
                    <th>reference</th>
                    <th>balance</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAccounts.map((a:any) => (
                    <tr key={a.id} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="py-2 font-mono text-xs" title={a.id}>{String(a.id).slice(0,10)}…</td>
                      <td className="text-xs">{a.merchantName || '—'}</td>
                      <td className="font-mono text-xs" title={a.reference || ''}>{a.reference || '—'}</td>
                      <td className="text-xs">{a.__latestBalance ? `${a.__latestBalance.asset} ${a.__latestBalance.balance}` : '—'}</td>
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
                    <th className="py-2">id</th>
                    <th>type</th>
                    <th>status</th>
                    <th>amount</th>
                    <th>asset</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map(p => (
                    <tr key={p.paymentId} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="py-2 font-mono text-xs" title={p.paymentId}>{p.paymentId.slice(0,10)}…</td>
                      <td className="text-xs">{p.rawPspEvent?.type || p.rawPspEvent?.Type || p.rawPspEvent?.eventCode || p.rawPspEvent?.scheme || p.rawPspEvent?.Type || '—'}</td>
                      <td className="text-xs">{p.status}</td>
                      <td className="text-xs">{p.rawPspEvent?.amount ?? p.normalizedEvent.amountMinor}</td>
                      <td className="text-xs">{p.rawPspEvent?.asset || p.normalizedEvent.currency}</td>
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
      <LiveAPIMonitor title="Formance Payments v3" baseEndpoint="https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/payments/v3" filterPrefix="/api/payments/v3" />
    </div>
  )
}


