import { useMemo, useState, useEffect } from 'react'
import { Plus, ArrowRightLeft, Download, Trash2, Play, Save, Send, RefreshCcw, Search, Wand2 } from 'lucide-react'
import { NormalizedGraph, AccountNode, TxnEdge, mergeMapping } from '@/services/diagramAdapter'
import { EditableDiagramCanvas } from '@/components/EditableDiagramCanvas'
import { LiveAPIMonitor } from '@/components/LiveAPIMonitor'
import { createTransaction, listAccounts, listAccountsWithBalances, updateAccountMetadata, updateTransactionMetadata, searchTransactions, searchVolumes, searchAccounts, searchBalances } from '@/services/ledgerAdapter'

export function Designer() {
  const [ledger, setLedger] = useState('cursor-test')
  const [accountBalances, setAccountBalances] = useState<Array<{ account: string; balances: Record<string, number>; metadata?: Record<string, any> }>>([])
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [txnSuccess, setTxnSuccess] = useState<string | null>(null)
  const [metaSuccess, setMetaSuccess] = useState<string | null>(null)
  const [metadataDraft, setMetadataDraft] = useState<string>('')
  const [numscript, setNumscript] = useState<string>('')
  const [numscriptVars, setNumscriptVars] = useState<string>('{}')
  const [numscriptRef, setNumscriptRef] = useState<string>('')
  const [numscriptSuccess, setNumscriptSuccess] = useState<string | null>(null)
  // duplicate ensureAccountVisible removed (defined above)
  const ensureWorldVisible = () => {
    const exists = accounts.some(a => a.id === 'world')
    if (exists) return
    const elementId = `el_world_${Date.now()}`
    setAccounts(prev => [...prev, { id: 'world', label: 'world', elementId, x: 40, y: 40, w: 160, h: 60 }])
  }
  const addLocalTransaction = (fromId: string, toId: string, amount: number, asset: string) => {
    if (!toId) return
    const id = `txn.script_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    const elementId = `ar_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    setTxns(prev => [...prev, { id, label: 'Script', elementId, fromId, toId, metadata: { amount, asset } }])
  }
  const ensureAccountVisible = (accountId: string) => {
    if (!accountId || accountId === 'world' || accountId === '@world') return
    const exists = accounts.some(a => a.id === accountId)
    if (exists) return
    const x = 100 + accounts.length * 40
    const y = 120 + accounts.length * 20
    const elementId = `el_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
    setAccounts(prev => [...prev, { id: accountId, label: accountId, elementId, x, y, w: 160, h: 60 }])
  }
  const numscriptTemplates: Array<{ key: string; name: string; script: string; vars: string }> = [
    {
      key: 'simple-send',
      name: 'Simple send',
      script: `vars {
  account $destination
}

send [USD 100] (
  source = @world
  destination = $destination
)`,
      vars: JSON.stringify({ destination: 'user:alice' }, null, 2)
    },
    {
      key: 'multiple-send',
      name: 'Multiple send',
      script: `vars {
  account $dest1
  account $dest2
}

send [USD 100] (
  source = @world
  destination = $dest1
)

send [USD 50] (
  source = @world
  destination = $dest2
)`,
      vars: JSON.stringify({ dest1: 'user:alice', dest2: 'user:bob' }, null, 2)
    }
  ]
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [accounts, setAccounts] = useState<AccountNode[]>([])
  const [txns, setTxns] = useState<TxnEdge[]>([])
  const [nextIdx, setNextIdx] = useState(1)

  const graph: NormalizedGraph = useMemo(() => ({ accounts, transactions: txns }), [accounts, txns])

  const loadBalances = async () => {
    try {
      setBalancesLoading(true)
      // Get accounts list with expanded volumes (which includes balances)
      const accountsResponse = await listAccountsWithBalances(ledger)
      const accounts = accountsResponse?.cursor?.data || []
      
      // Convert to displayable balances. Prefer explicit balance; fallback to input-output.
      const accountsWithBalances = accounts.map((account: any) => {
        const balances: Record<string, number> = {}
        const source = account.volumes || account.balances || {}
        Object.keys(source).forEach((asset) => {
          const vol: any = (source as any)[asset]
          let bal: number | null = null
          if (vol && typeof vol.balance !== 'undefined') {
            const raw = (vol as any).balance
            const num = typeof raw === 'number' ? raw : Number(raw)
            if (!Number.isNaN(num)) bal = num
          } else {
            const rawInput = typeof vol?.input !== 'undefined' ? (vol as any).input : 0
            const rawOutput = typeof vol?.output !== 'undefined' ? (vol as any).output : 0
            const input = typeof rawInput === 'number' ? rawInput : Number((rawInput as any)?.value ?? rawInput)
            const output = typeof rawOutput === 'number' ? rawOutput : Number((rawOutput as any)?.value ?? rawOutput)
            if (!Number.isNaN(input) || !Number.isNaN(output)) {
              const i = Number.isNaN(input) ? 0 : input
              const o = Number.isNaN(output) ? 0 : output
              if (i !== 0 || o !== 0) bal = i - o
            }
          }
          if (typeof bal === 'number' && !Number.isNaN(bal)) {
            balances[asset] = bal
          }
        })
        return {
          account: account.address,
          balances,
          metadata: account.metadata || {}
        }
      })
      
      setAccountBalances(accountsWithBalances)
      setStatus(`Ledger: ${ledger} • ${accountsWithBalances.length} accounts`)
    } catch (error) {
      console.error('Failed to load balances:', error)
      setStatus('Failed to fetch balances')
      setAccountBalances([])
    } finally {
      setBalancesLoading(false)
    }
  }

  useEffect(() => {
    loadBalances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger])

  const addAccount = () => {
    const x = 100 + accounts.length * 40
    const y = 120 + accounts.length * 20
    const id = '<placeholder>'
    const label = 'nickname'
    setAccounts([...accounts, { id, label, elementId: `el_${Date.now()}`, x, y, w: 160, h: 60 }])
  }

  const startArrowMode = () => {
    if (accounts.length < 2) {
      setStatus('Add two accounts first')
      return
    }
    setArrowMode(true)
    setArrowFrom(null)
    setStatus('Click the source account for the posting')
  }

  const handleNodeClick = (elementId: string) => {
    if (arrowMode) {
      const account = accounts.find(a => a.elementId === elementId)
      if (!account) return
      
      if (!arrowFrom) {
        setArrowFrom(elementId)
        setStatus(`Selected ${account.id} as source. Now click the destination account.`)
      } else {
        const fromAccount = accounts.find(a => a.elementId === arrowFrom)
        if (!fromAccount) return
        
        // Always create a new arrow (posting) as its own edge
        const id = `txn.manual_${nextIdx}`
        setNextIdx(nextIdx + 1)
        const newTxn = { 
          id, 
          label: 'Transfer', 
          elementId: `ar_${Date.now()}`, 
          fromId: fromAccount.id, 
          toId: account.id, 
          metadata: { asset: 'USD', amount: 1 }
        }
        setTxns([...txns, newTxn])
        setSelectedTxnIds([id])
        setStatus(`Added posting: ${fromAccount.id} → ${account.id}`)
        setArrowMode(false)
        setArrowFrom(null)
      }
    } else {
      // Toggle selection on second click
      setSelectedNodeEl(prev => (prev === elementId ? null : elementId))
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const runSelectedTxns = async () => {
    if (selectedTxnIds.length === 0) return
    try {
      setStatus(`Executing ${selectedTxnIds.length} posting(s) as one transaction...`)
      const postings = selectedTxnIds.map(id => txns.find(t => t.id === id)).filter(Boolean).map(t => {
        const asset = String(t!.metadata?.asset || 'USD')
        const precisionMatch = asset.match(/\/(\d+)/)
        const precision = precisionMatch ? parseInt(precisionMatch[1], 10) : 0
        const scale = Math.pow(10, isNaN(precision) ? 0 : precision)
        const amountFloat = Number(t!.metadata?.amount || 1)
        const amount = Math.round(amountFloat * scale)
        return {
          source: t!.fromId,
          destination: t!.toId,
          amount,
          asset
        }
      })
      const uuidV4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      const payload: any = {
        // RFC3339 / ISO-8601 timestamp
        timestamp: new Date().toISOString(),
        postings,
        reference: uuidV4(),
        // Keep metadata minimal and valid
        metadata: postings.length === 1 ? { txid: selectedTxnIds[0] } : { txid: selectedTxnIds.join(',') }
      }
      const result = await createTransaction(ledger, payload)
      console.log('Transaction result:', result)
      setTxnSuccess(`Succeeded at ${new Date().toLocaleTimeString()}`)
      setStatus(`Successfully executed ${postings.length} posting(s)`)
      setAnimateTxnIds([...selectedTxnIds])
      setAnimateNonce(n => n + 1)
      await loadBalances()
    } catch (error: any) {
      console.error('Transaction error:', error)
      setStatus(`Failed to execute: ${error.message}`)
      setTxnSuccess(null)
    }
  }

  const updateNodePos = (accountElementId: string, x: number, y: number) => {
    setAccounts(prev => prev.map(a => a.elementId === accountElementId ? { ...a, x, y } : a))
  }

  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([])
  const [selectedNodeEl, setSelectedNodeEl] = useState<string | null>(null)
  const [arrowMode, setArrowMode] = useState(false)
  const [arrowFrom, setArrowFrom] = useState<string | null>(null)
  // Deprecated single-arrow animation state (kept for compatibility, unused now)
  const [animateTxnId, setAnimateTxnId] = useState<string | null>(null)
  // IDs of arrows to animate after a run
  const [animateTxnIds, setAnimateTxnIds] = useState<string[]>([])
  const [animateNonce, setAnimateNonce] = useState(0)
  const selected = selectedTxnIds.length === 1 ? txns.find(t => t.id === selectedTxnIds[0]) : undefined
  const selectedNode = accounts.find(a => a.elementId === selectedNodeEl)

  // Reorder ledger accounts list so the selected account (if any) appears first
  const accountsList = useMemo(() => {
    const list = [...accountBalances]
    const selId = selectedNode?.id
    if (!selId) return list
    const idx = list.findIndex(r => r.account === selId)
    if (idx > -1) {
      const [row] = list.splice(idx, 1)
      return [row, ...list]
    }
    // If not present in ledger, synthesize a row for visibility
    const synthetic: { account: string; balances: Record<string, number>; metadata?: Record<string, any> } = {
      account: selId,
      balances: {},
      metadata: (selectedNode as any)?.metadata || {}
    }
    return [synthetic, ...list]
  }, [accountBalances, selectedNode?.id])

  useEffect(() => {
    if (selectedNode) {
      setMetadataDraft(JSON.stringify(selectedNode.metadata || {}, null, 2))
    } else {
      setMetadataDraft('')
    }
  }, [selectedNodeEl])

  const updateAccount = (elementId: string, updates: Partial<AccountNode>) => {
    setAccounts(prev => prev.map(a => {
      if (a.elementId === elementId) {
        const updated = { ...a, ...updates }
        // If ID changed, update all transactions
        if (updates.id && updates.id !== a.id) {
          const oldId = a.id
          const newId = updates.id
          setTxns(prevTxns => prevTxns.map(t => ({ 
            ...t, 
            fromId: t.fromId === oldId ? newId : t.fromId, 
            toId: t.toId === oldId ? newId : t.toId 
          })))
        }
        return updated
      }
      return a
    }))
  }

  const updateTransaction = (id: string, updates: Partial<TxnEdge>) => {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, ...updates, metadata: { ...t.metadata, ...updates.metadata } } : t))
  }
  
  const updateSelectedTxn = (updates: Partial<TxnEdge>) => {
    if (selected) updateTransaction(selected.id, updates)
  }

  const deleteAccount = (elementId: string) => {
    const account = accounts.find(a => a.elementId === elementId)
    if (!account) return
    setAccounts(prev => prev.filter(a => a.elementId !== elementId))
    setTxns(prev => prev.filter(t => t.fromId !== account.id && t.toId !== account.id))
    if (selectedNodeEl === elementId) setSelectedNodeEl(null)
    setStatus(`Deleted account ${account.id} and related transactions`)
  }

  const deleteTransaction = (id: string) => {
    setTxns(prev => prev.filter(t => t.id !== id))
    setSelectedTxnIds(prev => prev.filter(x => x !== id))
    setStatus(`Deleted transaction ${id}`)
  }

  const deleteSelectedTransactions = () => {
    if (selectedTxnIds.length === 0) return
    setTxns(prev => prev.filter(t => !selectedTxnIds.includes(t.id)))
    setSelectedTxnIds([])
    setStatus(`Deleted ${selectedTxnIds.length} transaction(s)`)
  }

  // Keyboard shortcuts for delete when not typing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement as HTMLElement | null
        const tag = active?.tagName?.toLowerCase()
        const isTyping = tag === 'input' || tag === 'textarea' || active?.isContentEditable
        if (isTyping) return
        if (selectedNodeEl) {
          e.preventDefault()
          deleteAccount(selectedNodeEl)
          return
        }
        if (selectedTxnIds.length > 0) {
          e.preventDefault()
          deleteSelectedTransactions()
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedTxnIds, selectedNodeEl])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/70 backdrop-blur rounded-lg px-4 py-3 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Diagram Designer</h1>
          <span className="text-xs px-2 py-1 rounded border border-emerald-600 text-emerald-300 bg-emerald-900/20">
            {status ? status : `Ledger: ${ledger}`}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={addAccount}>
            <Plus className="h-4 w-4" />
            <span>Add account</span>
          </button>
          <button 
            className={`btn-primary inline-flex items-center gap-2 px-3 h-9 ${accounts.length < 2 ? 'opacity-50 cursor-not-allowed' : ''} ${arrowMode ? 'bg-emerald-700' : ''}`}
            onClick={startArrowMode}
            disabled={accounts.length < 2}
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>{arrowMode ? 'Adding posting…' : 'Add posting'}</span>
          </button>
          {arrowMode && (
            <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={() => { setArrowMode(false); setArrowFrom(null); setStatus('') }}>
              Cancel
            </button>
          )}
          <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={exportJson}>
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card hover:shadow-md transition-shadow relative">
          <EditableDiagramCanvas 
            graph={graph} 
            onRunTransaction={() => runSelectedTxns()} 
            onSelectArrow={(id) => setSelectedTxnIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
            onNodeMove={updateNodePos} 
            onSelectNode={handleNodeClick}
            onUpdateAccount={updateAccount}
            onUpdateTransaction={updateTransaction}
            arrowMode={arrowMode}
            arrowFrom={arrowFrom}
            selectedTxnIds={selectedTxnIds}
            selectedNodeElementId={selectedNodeEl}
            balances={Object.fromEntries(accountBalances.map(r => [r.account, r.balances]))}
            animateTxnIds={animateTxnIds}
            animateNonce={animateNonce}
          />
          {(selectedNodeEl || selectedTxnIds.length > 0) && (
            <div className="absolute bottom-3 left-3 z-10 bg-slate-950/70 border border-slate-800 rounded-md shadow p-2 flex gap-2">
              {/* Run should be left-most when visible */}
              {selectedTxnIds.length > 0 && (
                <button 
                  className="btn-primary inline-flex items-center gap-2 px-3 h-9"
                  onClick={() => runSelectedTxns()}
                >
                  <Play className="h-4 w-4" />
                  <span>Run transaction</span>
                </button>
              )}
              {selectedNodeEl && (
                <button 
                  className="btn-danger inline-flex items-center gap-2 px-3 h-9"
                  onClick={() => deleteAccount(selectedNodeEl)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete account</span>
                </button>
              )}
              {selectedTxnIds.length > 0 && (
                <button 
                  className="btn-danger inline-flex items-center gap-2 px-3 h-9"
                  onClick={() => deleteSelectedTransactions()}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete transaction</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="card space-y-3 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium">Numscript Runner</div>
          <div className="space-y-2">
            <div>
              <label className="label">Template</label>
              <select
                className="input h-10"
                value={selectedTemplate}
                onChange={(e) => {
                  const key = e.target.value
                  setSelectedTemplate(key)
                  const tpl = numscriptTemplates.find(t => t.key === key)
                  if (tpl) {
                    setNumscript(tpl.script)
                    setNumscriptVars(tpl.vars)
                    setStatus(`Loaded template: ${tpl.name}`)
                  }
                }}
              >
                <option value="">Choose a template…</option>
                {numscriptTemplates.map(t => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </select>
              <div className="text-xs text-slate-400 mt-1">
                Templates inspired by Numscript Playground (<a className="underline" href="https://playground.numscript.org/?template=complex-sources" target="_blank" rel="noreferrer">Complex sources</a>).
              </div>
            </div>
            <div>
              <label className="label">Script (Numscript)</label>
              <textarea
                className="input min-h-[140px] font-mono text-xs"
                value={numscript}
                onChange={(e) => setNumscript(e.target.value)}
                placeholder={'vars {\naccount $user\n}\nsend [USD/2 100] (\n\tsource = @world\n\tdestination = $user\n)'}
              />
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-emerald-600 text-emerald-700 rounded-md cursor-pointer hover:bg-emerald-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14.59 2.59a2 2 0 0 0-2.83 0L3 11.34V21a1 1 0 0 0 1 1h9.66l8.75-8.76a2 2 0 0 0 0-2.83l-7.82-7.82ZM7 20H5v-2l8.59-8.59 2 2L7 20Zm9.41-9.41-2-2 1.3-1.3 2 2-1.3 1.3Z"/></svg>
                  <span className="text-sm font-medium">Choose Numscript file</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="text/plain"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => setNumscript(String(reader.result || ''))
                      reader.readAsText(file)
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="label">Vars (JSON)</label>
              <textarea
                className="input min-h-[80px] font-mono text-xs"
                value={numscriptVars}
                onChange={(e) => setNumscriptVars(e.target.value)}
                placeholder={'{\n  "user": "alice"\n}'}
              />
            </div>
            <div>
              <label className="label">Reference (optional)</label>
              <input className="input" value={numscriptRef} onChange={(e) => setNumscriptRef(e.target.value)} placeholder="ref-123" />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-primary inline-flex items-center gap-2 px-3 h-9"
                onClick={async () => {
                  try {
                    const vars = numscriptVars ? JSON.parse(numscriptVars) : {}
                    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
                    const payload: any = {
                      script: {
                        plain: numscript,
                        vars
                      },
                      reference: (numscriptRef || 'script') + ':' + nonce
                    }
                    setStatus('Submitting numscript transaction...')
                    await createTransaction(ledger, payload)
                    setNumscriptSuccess(`Submitted at ${new Date().toLocaleTimeString()}`)
                    setStatus('Numscript transaction submitted')
                    // Ensure accounts and a linking transaction are visible on the canvas
                    ensureWorldVisible()
                    if (selectedTemplate === 'simple-send' || selectedTemplate === 'complex-sources') {
                      const dest = (vars && (vars.destination || vars.dest || vars.to)) as string
                      if (typeof dest === 'string') {
                        ensureAccountVisible(dest)
                        addLocalTransaction('world', dest, 100, 'USD')
                      }
                    } else if (selectedTemplate === 'multiple-send') {
                      const dest1 = (vars && (vars.dest1 || vars.destination1)) as string
                      const dest2 = (vars && (vars.dest2 || vars.destination2)) as string
                      if (typeof dest1 === 'string') { ensureAccountVisible(dest1); addLocalTransaction('world', dest1, 100, 'USD') }
                      if (typeof dest2 === 'string') { ensureAccountVisible(dest2); addLocalTransaction('world', dest2, 50, 'USD') }
                    } else {
                      Object.values(vars).forEach((v: any) => {
                        if (typeof v === 'string' && v.toLowerCase() !== 'world' && v !== '@world') {
                          ensureAccountVisible(v)
                          addLocalTransaction('world', v, 1, 'USD')
                        }
                      })
                    }
                    await loadBalances()
                  } catch (e: any) {
                    setNumscriptSuccess(null)
                    setStatus(`Failed to submit numscript: ${e.message || 'Invalid input'}`)
                  }
                }}
                disabled={!numscript.trim()}
              >
                <Send className="h-4 w-4" />
                <span>Send Numscript</span>
              </button>
              {numscriptSuccess && <span className="text-xs text-emerald-400">{numscriptSuccess}</span>}
            </div>
          </div>
        </div>
        <div className="card space-y-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Ledger Accounts</div>
            <div className="flex items-center gap-2">
              <input className="input w-36" value={ledger} onChange={(e) => setLedger(e.target.value)} />
              <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={loadBalances}>
                <RefreshCcw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          {status && <div className="text-xs text-slate-400">{status}</div>}
          <div className="max-h-80 overflow-auto space-y-2">
            {balancesLoading && <div className="text-sm text-slate-400">Loading accounts…</div>}
            {!balancesLoading && accountBalances.length === 0 && (
              <div className="text-sm text-slate-400">No accounts found in ledger</div>
            )}
            {!balancesLoading && accountsList.map((row) => {
              const isSelectedRow = selectedNode?.id === row.account
              return (
              <button key={row.account} className={`w-full p-2 border rounded text-left transition ${isSelectedRow ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 hover:bg-slate-800'}`} onClick={() => {
                const node = accounts.find(a => a.id === row.account)
                if (node) {
                  setSelectedNodeEl(prev => (prev === node.elementId ? null : node.elementId))
                } else {
                  // Create a lightweight local node to inspect metadata
                  const elementId = `el_meta_${Date.now()}`
                  const newNode: AccountNode = { id: row.account, label: row.account, elementId, x: 40, y: 60, w: 160, h: 60, metadata: (row as any).metadata || {} }
                  setAccounts(prev => [...prev, newNode])
                  setSelectedNodeEl(elementId)
                }
              }}>
                <div className="text-sm font-mono text-slate-100">{row.account}</div>
                <div className="text-xs text-slate-400">
                  {Object.keys(row.balances).length === 0 ? '—' :
                    Object.entries(row.balances).map(([asset, bal]) => `${asset}: ${bal}`).join(' • ')}
                </div>
              </button>
            )})}
          </div>
        </div>
        <div className="card space-y-3 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium">Account Metadata</div>
          {!selectedNodeEl && <div className="text-sm text-slate-400">Select an account to add metadata</div>}
          {selectedNodeEl && selectedNode && (
            <>
              <div className="text-xs text-slate-400 mb-2">
                Account: <span className="font-mono">{selectedNode.id}</span>
              </div>
              <div className="text-xs text-slate-400">
                Double-click account ID or name to edit directly on canvas
              </div>
              <div>
                <label className="label">Metadata (JSON)</label>
                <textarea 
                  className="input min-h-[120px] font-mono text-xs" 
                  value={metadataDraft}
                  onChange={(e) => setMetadataDraft(e.target.value)}
                  placeholder='{\n  "key": "value"\n}'
                />
              </div>
              <button 
                className="btn-primary w-full inline-flex items-center justify-center gap-2 h-10" 
                onClick={async () => {
                  try {
                    setStatus('Updating account metadata...')
                    const parsed = metadataDraft ? JSON.parse(metadataDraft) : {}
                    await updateAccountMetadata(ledger, selectedNode.id, parsed)
                    updateAccount(selectedNodeEl, { metadata: parsed })
                    setStatus(`Updated metadata for ${selectedNode.id}`)
                    setMetaSuccess(`Updated at ${new Date().toLocaleTimeString()}`)
                    await loadBalances() // Refresh to get latest data
                  } catch (error: any) {
                    setMetaSuccess(null)
                    setStatus(`Failed to update metadata: ${error.message || 'Invalid JSON'}`)
                  }
                }}
              >
                <Save className="h-4 w-4" />
                <span>Update metadata in ledger</span>
              </button>
              {/* Delete moved to canvas toolbar */}
              {metaSuccess && <div className="text-xs text-emerald-400">{metaSuccess}</div>}
            </>
          )}
        </div>
        <div className="card space-y-3 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium">{selected ? 'Transaction Metadata' : 'Query Explorer'}</div>
          {!selected && (
            <QueryExplorer 
              ledger={ledger}
              onStatus={setStatus}
            />
          )}
          {selected && (
            <>
              <div className="text-xs text-slate-400 mb-2">
                Transaction: <span className="font-mono">{selected.id}</span><br/>
                {selected.fromId} → {selected.toId}
              </div>
              <div className="text-xs text-slate-400">
                Double-click arrow label to edit amount/asset directly
              </div>
              <TransactionMetadataEditor 
                value={Object.fromEntries(
                  Object.entries(selected.metadata || {}).filter(([k]) => k !== 'amount' && k !== 'asset')
                )}
                onSubmit={async (metadata) => {
                  try {
                    setStatus('Updating transaction metadata...')
                    await updateTransactionMetadata(ledger, selected.id, metadata)
                    updateTransaction(selected.id, { metadata: { ...(selected.metadata || {}), ...metadata } })
                    setStatus('Updated transaction metadata')
                  } catch (e: any) {
                    setStatus(`Failed to update transaction metadata: ${e.message}`)
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={() => runTxn(selected.id)}>
                  <Play className="h-4 w-4" />
                  <span>Run this transaction</span>
                </button>
                {txnSuccess && <span className="text-xs text-emerald-400">{txnSuccess}</span>}
              </div>
              {/* Delete moved to canvas toolbar */}
            </>
          )}
        </div>
      </div>
      
      <LiveAPIMonitor />
    </div>
  )
}

function TransactionMetadataEditor({ value, onSubmit }: { value: Record<string, any>, onSubmit: (v: Record<string, any>) => Promise<void> | void }) {
  const [draft, setDraft] = useState<string>(JSON.stringify(value || {}, null, 2))
  useEffect(() => {
    setDraft(JSON.stringify(value || {}, null, 2))
  }, [JSON.stringify(value)])
  return (
    <div>
      <label className="label">Additional Metadata (JSON)</label>
      <textarea 
        className="input min-h-[100px] font-mono text-xs" 
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder='{"\n  "reference": "INV-123"\n}'
      />
      <div className="mt-2">
        <button 
          className="btn"
          onClick={async () => {
            try {
              const parsed = draft ? JSON.parse(draft) : {}
              await onSubmit(parsed)
            } catch {}
          }}
        >
          Save Transaction Metadata
        </button>
      </div>
    </div>
  )
}

function QueryExplorer({ ledger, onStatus }: { ledger: string; onStatus: (s: string) => void }) {
  const [resource, setResource] = useState<'transactions' | 'accounts' | 'volumes' | 'balances'>('transactions')
  const [queryText, setQueryText] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runQuery = async () => {
    setLoading(true)
    setResult(null)
    try {
      const trimmed = queryText.trim()
      const filter = trimmed ? JSON.parse(trimmed) : {}
      let data: any = null
      if (resource === 'transactions') {
        data = await searchTransactions(ledger, filter)
      } else if (resource === 'accounts') {
        data = await searchAccounts(ledger, filter)
      } else if (resource === 'volumes') {
        data = await searchVolumes(ledger, filter)
      } else if (resource === 'balances') {
        data = await searchBalances(ledger, filter)
      }
      setResult(data)
      onStatus('Query executed')
    } catch (e: any) {
      onStatus(`Query failed: ${e.message || 'error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="label">Resource</label>
        <select className="input h-10 w-48" value={resource} onChange={(e) => setResource(e.target.value as any)}>
          <option value="transactions">List transactions</option>
          <option value="balances">Aggregate balances</option>
          <option value="volumes">Volumes</option>
          <option value="accounts">Accounts</option>
        </select>
      </div>
      <div>
        <label className="label">Filter (JSON)</label>
        <textarea
          className="input min-h-[120px] font-mono text-xs"
          placeholder='{"$match": {"source": "order::pending"}}'
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
        <div className="text-xs text-slate-400 mt-1">
          See filtering syntax in the docs: <a className="underline" target="_blank" rel="noreferrer" href="https://docs.formance.com/modules/ledger/working-with-the-ledger/filtering-queries#filtering-queries">Filtering queries</a>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={runQuery} disabled={loading}>
          <Search className="h-4 w-4" />
          <span>{loading ? 'Running…' : 'Run query'}</span>
        </button>
        <button className="btn-secondary inline-flex items-center gap-2 px-3 h-9" onClick={() => {
          try {
            const pretty = JSON.stringify(queryText ? JSON.parse(queryText) : {}, null, 2)
            setQueryText(pretty)
          } catch {}
        }}>
          <Wand2 className="h-4 w-4" />
          <span>Beautify</span>
        </button>
      </div>
      {result && (
        <div className="mt-2 space-y-2">
          {/* Accounts */}
          {resource === 'accounts' && (
            <div className="max-h-64 overflow-auto space-y-2">
              {(result.cursor?.data || result.data || []).map((row: any, idx: number) => (
                <div key={row.address || row.account || idx} className="p-2 border border-slate-700 rounded text-left hover:bg-slate-800">
                  <div className="text-sm font-mono text-slate-100">{row.address || row.account}</div>
                  <div className="text-xs text-slate-400">
                    {row.volumes ? (
                      Object.keys(row.volumes).length === 0 ? '—' : Object.entries(row.volumes).map(([asset, vol]: any) => `${asset}: ${vol.balance}`).join(' • ')
                    ) : row.balances ? (
                      Object.keys(row.balances).length === 0 ? '—' : Object.entries(row.balances).map(([asset, bal]: any) => `${asset}: ${bal}`).join(' • ')
                    ) : (
                      row.metadata ? Object.keys(row.metadata).length + ' metadata fields' : '—'
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Transactions */}
          {resource === 'transactions' && (
            <div className="max-h-64 overflow-auto space-y-2">
              {(result.cursor?.data || result.data || []).map((tx: any) => (
                <div key={tx.id} className="p-2 border border-slate-700 rounded hover:bg-slate-800">
                  <div className="text-sm text-slate-100 font-mono">{tx.id}</div>
                  <div className="text-xs text-slate-400">
                    {(tx.postings || []).map((p: any, i: number) => (
                      <span key={i} className="mr-2">{p.source} → {p.destination} [{p.asset} {p.amount}]</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Volumes */}
          {resource === 'volumes' && (
            <div className="max-h-64 overflow-auto space-y-2">
              {(result.cursor?.data || result.data || []).map((v: any, idx: number) => (
                <div key={idx} className="p-2 border border-slate-700 rounded hover:bg-slate-800">
                  <div className="text-sm text-slate-100 font-mono">{v.account} • {v.asset}</div>
                  <div className="text-xs text-slate-400">balance: {v.balance}</div>
                </div>
              ))}
            </div>
          )}
          {/* Aggregated Balances */}
          {resource === 'balances' && (
            <div className="max-h-64 overflow-auto space-y-2">
              {(result.data || []).map((row: any, idx: number) => (
                <div key={row.account || idx} className="p-2 border border-slate-700 rounded hover:bg-slate-800">
                  <div className="text-sm text-slate-100 font-mono">{row.account}</div>
                  <div className="text-xs text-slate-400">
                    {row.balances && Object.keys(row.balances).length > 0 ?
                      Object.entries(row.balances).map(([asset, bal]: any) => `${asset}: ${bal}`).join(' • ') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
