import { useEffect, useState } from 'react'
import { Plus, RefreshCcw, Play, Trash2, TestTube, ChevronRight, Upload } from 'lucide-react'
import { LiveAPIMonitor } from '@/components/LiveAPIMonitor'
import { listWorkflows, createWorkflow, deleteWorkflow, runWorkflow, listWorkflowInstances, listTriggers, createTrigger, testTrigger, deleteTrigger } from '@/services/orchestrationAdapter'

type Tab = 'workflows' | 'triggers' | 'instances'

export function OrchestrationVisualizer() {
  const [tab, setTab] = useState<Tab>('workflows')
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [triggers, setTriggers] = useState<any[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<any | null>(null)
  const [instances, setInstances] = useState<any[]>([])
  const defaultWorkflowConfig = {
    name: 'simple-workflow',
    stages: [
      {
        send: {
          amount: { amount: '${amount}', asset: '${asset}' },
          destination: { account: { id: '${destination}', ledger: '${ledger}' } },
          source: { account: { id: '${source}', ledger: '${ledger}' } }
        }
      }
    ]
  }
  const [newWfJson, setNewWfJson] = useState<string>(() => JSON.stringify(defaultWorkflowConfig, null, 2))

  // Use the same ledger as Designer defaults
  const ledger = 'cursor-test'

  // Dynamic run variables inferred from selected workflow placeholders
  const [runVars, setRunVars] = useState<Record<string, string>>({})
  const [varNames, setVarNames] = useState<string[]>([])

  const defaultValueForVar = (name: string): string => {
    const lower = name.toLowerCase()
    if (lower.startsWith('ledger')) return ledger
    if (lower.startsWith('source')) return 'world'
    if (lower.startsWith('destination')) return ''
    if (lower.startsWith('amount')) return '10'
    if (lower.startsWith('asset')) return 'USD'
    return ''
  }

  const extractVarNamesFromConfig = (cfg: any): string[] => {
    const found = new Set<string>()
    const walk = (node: any) => {
      if (node == null) return
      if (typeof node === 'string') {
        const regex = /\$\{([^}]+)\}/g
        let m: RegExpExecArray | null
        while ((m = regex.exec(node))) {
          found.add(m[1])
        }
      } else if (Array.isArray(node)) {
        node.forEach(walk)
      } else if (typeof node === 'object') {
        Object.values(node).forEach(walk)
      }
    }
    walk(cfg)
    return Array.from(found)
  }

  useEffect(() => {
    if (!selectedWorkflow?.config) return
    const names = extractVarNamesFromConfig(selectedWorkflow.config)
    names.sort((a, b) => a.localeCompare(b))
    setVarNames(names)
    setRunVars(prev => {
      const next: Record<string, string> = {}
      names.forEach(n => { next[n] = prev[n] ?? defaultValueForVar(n) })
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkflow?.id])
  const [newTrig, setNewTrig] = useState<{ name: string; event: string; workflowID: string; filter: string; varsJson: string }>({ name: 'Demo Trigger', event: 'payments.payment.succeeded', workflowID: '', filter: '', varsJson: '{}' })
  const [busy, setBusy] = useState<{ [k: string]: boolean }>({})

  const setBusyKey = (k: string, v: boolean) => setBusy(prev => ({ ...prev, [k]: v }))

  const reload = async () => {
    setLoading(true)
    try {
      const [wfRes, trgRes] = await Promise.all([
        listWorkflows({ pageSize: 50 }),
        listTriggers({ pageSize: 50 })
      ])
      setWorkflows((wfRes?.cursor?.data || wfRes?.data || wfRes || []) as any[])
      setTriggers((trgRes?.cursor?.data || trgRes?.data || trgRes || []) as any[])
    } catch (error) {
      console.error('Failed to reload orchestration data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const selectedWorkflowId = selectedWorkflow?.id || ''

  const loadInstances = async (workflowId?: string) => {
    setBusyKey('instances', true)
    try {
      const res = await listWorkflowInstances(workflowId, { pageSize: 50 })
      const rows = (res?.cursor?.data || res?.data || res || []) as any[]
      setInstances(rows)
      setTab('instances')
    } catch (err) {
    } finally {
      setBusyKey('instances', false)
    }
  }

  const doCreateWorkflow = async () => {
    setBusyKey('createWorkflow', true)
    try {
      let body: any = {}
      try { body = JSON.parse(newWfJson || '{}') } catch { throw new Error('Invalid JSON body') }
      await createWorkflow(body)
      await reload()
    } catch {} finally { setBusyKey('createWorkflow', false) }
  }

  const doDeleteWorkflow = async (id: string) => {
    setBusyKey('deleteWorkflow', true)
    try {
      await deleteWorkflow(id)
      setSelectedWorkflow(null)
      await reload()
    } catch {} finally { setBusyKey('deleteWorkflow', false) }
  }

  const doRunWorkflow = async (id: string) => {
    setBusyKey('runWorkflow', true)
    try {
      await runWorkflow(id, runVars)
      await loadInstances(id)
    } catch {} finally { setBusyKey('runWorkflow', false) }
  }

  const doCreateTrigger = async () => {
    setBusyKey('createTrigger', true)
    try {
      let vars: any = {}
      try { vars = JSON.parse(newTrig.varsJson || '{}') } catch {}
      const payload: any = { event: newTrig.event, workflowID: newTrig.workflowID, name: newTrig.name }
      if (newTrig.filter) payload.filter = newTrig.filter
      if (vars && Object.keys(vars).length > 0) payload.vars = vars
      await createTrigger(payload)
      await reload()
    } catch {} finally { setBusyKey('createTrigger', false) }
  }

  const doTestTrigger = async (id: string) => {
    setBusyKey(`test-${id}`, true)
    try {
      const res = await testTrigger(id, {})
      const filterMatch = (res && (res.data?.filter?.match ?? res.data?.match ?? res.filter?.match ?? res.match))
      const filterError = (res && (res.data?.filter?.error ?? res.filter?.error))
      const message = typeof filterMatch === 'boolean'
        ? `Filter match: ${filterMatch}`
        : 'No filter defined; test executed.'
      alert(`${message}${filterError ? `\nError: ${filterError}` : ''}`)
    } catch (e: any) {
      alert('Test failed')
    } finally { setBusyKey(`test-${id}`, false) }
  }

  const doDeleteTrigger = async (id: string) => {
    setBusyKey(`del-${id}`, true)
    try {
      await deleteTrigger(id)
      await reload()
    } catch {} finally { setBusyKey(`del-${id}`, false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-950/70 backdrop-blur rounded-lg px-4 py-3 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Orchestration Visualizer</h1>
          <div className="text-xs text-slate-400">Workflows, triggers, and instances</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn inline-flex items-center gap-2 px-3 h-9" onClick={reload} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <div className="text-sm font-medium">Create workflow (upload JSON)</div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2">
              <label className="btn inline-flex items-center gap-2 h-9 px-3 cursor-pointer">
                <Upload className="h-4 w-4" /> Upload JSON
                <input type="file" accept="application/json" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setNewWfJson(String(reader.result || ''))
                  reader.readAsText(file)
                }} />
              </label>
              <button className="btn h-9 px-3" onClick={() => { try { JSON.parse(newWfJson); alert('JSON looks valid.') } catch { alert('Invalid JSON') } }}>Validate</button>
              <button className="btn h-9 px-3" onClick={() => { try { const pretty = JSON.stringify(JSON.parse(newWfJson || '{}'), null, 2); setNewWfJson(pretty) } catch {} }}>Beautify</button>
            </div>
            <textarea className="input h-40 font-mono text-xs" placeholder='{"name":"simple-workflow","stages":[...]}' value={newWfJson} onChange={(e) => setNewWfJson(e.target.value)} />
          </div>
          <div>
            <button className="btn-primary inline-flex items-center gap-2 px-3 h-9" onClick={doCreateWorkflow} disabled={!!busy.createWorkflow}>
              <Plus className="h-4 w-4" /> Create workflow
            </button>
          </div>

          <div className="mt-4 text-sm font-medium">Create trigger</div>
          <div className="grid grid-cols-1 gap-2">
            <input className="input h-9" placeholder="Trigger name (optional)" value={newTrig.name} onChange={(e) => setNewTrig({ ...newTrig, name: e.target.value })} />
            <input className="input h-9" placeholder="Event (e.g., payments.payment.succeeded)" value={newTrig.event} onChange={(e) => setNewTrig({ ...newTrig, event: e.target.value })} />
            <select className="input h-9" value={newTrig.workflowID} onChange={(e) => setNewTrig({ ...newTrig, workflowID: e.target.value })}>
              <option value="">Select workflow…</option>
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.config?.name || w.id}</option>
              ))}
            </select>
            <input className="input h-9" placeholder="Filter (optional)" value={newTrig.filter} onChange={(e) => setNewTrig({ ...newTrig, filter: e.target.value })} />
            <textarea className="input h-24 font-mono text-xs" placeholder="Vars JSON (optional)" value={newTrig.varsJson} onChange={(e) => setNewTrig({ ...newTrig, varsJson: e.target.value })} />
          </div>
          <div>
            <button className="btn inline-flex items-center gap-2 px-3 h-9" onClick={doCreateTrigger} disabled={!!busy.createTrigger || !newTrig.workflowID || !newTrig.event}>
              <Plus className="h-4 w-4" /> Create trigger
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-2 mb-3">
            <button className={`btn ${tab==='workflows'?'btn-primary':''}`} onClick={() => setTab('workflows')}>Workflows</button>
            <button className={`btn ${tab==='triggers'?'btn-primary':''}`} onClick={() => setTab('triggers')}>Triggers</button>
            <button className={`btn ${tab==='instances'?'btn-primary':''}`} onClick={() => { setTab('instances'); loadInstances(selectedWorkflowId) }}>Instances</button>
          </div>

          {selectedWorkflow && tab === 'workflows' && (
            <div className="mb-3 p-3 rounded border border-slate-800 bg-slate-900/60">
              <div className="text-xs text-slate-400 mb-2">Run workflow variables</div>
              <div className="grid grid-cols-2 gap-2">
                {varNames.length === 0 && (
                  <div className="text-xs text-slate-400 col-span-2">No variables detected in this workflow.</div>
                )}
                {varNames.map((name) => (
                  <div key={name} className="flex flex-col gap-1">
                    <div className="text-xs text-slate-300 truncate" title={name}>{name}</div>
                    <input className="input h-9" placeholder={name} value={runVars[name] ?? ''} onChange={(e)=>setRunVars({ ...runVars, [name]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button className="btn inline-flex items-center gap-2 h-8 px-2" onClick={() => doRunWorkflow(selectedWorkflow.id)} disabled={!!busy.runWorkflow}>
                  <Play className="h-3 w-3"/> Run with variables
                </button>
              </div>
            </div>
          )}

          {tab === 'workflows' && (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">name</th>
                    <th>id</th>
                    <th>created</th>
                    <th>updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map(w => (
                    <tr key={w.id} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="py-2">{w.config?.name || '—'}</td>
                      <td className="font-mono text-xs">{w.id}</td>
                      <td className="text-xs">{w.createdAt ? new Date(w.createdAt).toLocaleString() : '—'}</td>
                      <td className="text-xs">{w.updatedAt ? new Date(w.updatedAt).toLocaleString() : '—'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button className="btn inline-flex items-center gap-1 h-7 px-2" onClick={() => { setSelectedWorkflow(w); loadInstances(w.id) }}>
                            <ChevronRight className="h-3 w-3"/> Instances
                          </button>
                          <button className="btn inline-flex items-center gap-1 h-7 px-2" onClick={() => setSelectedWorkflow(w)}>
                            <Play className="h-3 w-3"/> Run
                          </button>
                          <button className="btn inline-flex items-center gap-1 h-7 px-2" onClick={() => doDeleteWorkflow(w.id)} disabled={!!busy.deleteWorkflow}>
                            <Trash2 className="h-3 w-3"/> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'triggers' && (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">name</th>
                    <th>event</th>
                    <th>workflowID</th>
                    <th>created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map(t => (
                    <tr key={t.id} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="py-2">{t.name || '—'}</td>
                      <td className="font-mono text-xs">{t.event}</td>
                      <td className="font-mono text-xs">{t.workflowID}</td>
                      <td className="text-xs">{t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button className="btn inline-flex items-center gap-1 h-7 px-2" onClick={() => doTestTrigger(t.id)} disabled={!!busy[`test-${t.id}`]}>
                            <TestTube className="h-3 w-3"/> Test
                          </button>
                          <button className="btn inline-flex items-center gap-1 h-7 px-2" onClick={() => doDeleteTrigger(t.id)} disabled={!!busy[`del-${t.id}`]}>
                            <Trash2 className="h-3 w-3"/> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'instances' && (
            <div className="max-h-[560px] overflow-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-400">Workflow: <span className="font-mono text-slate-200">{selectedWorkflow?.config?.name || selectedWorkflow?.id || '—'}</span></div>
                <button className="btn h-7 px-2" onClick={() => loadInstances()} disabled={!!busy.instances}>List all instances</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">instanceId</th>
                    <th>workflow</th>
                    <th>status</th>
                    <th>created</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map(ins => (
                    <tr key={ins.id || ins.instanceID} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="py-2 font-mono text-xs">{ins.id || ins.instanceID}</td>
                      <td className="text-xs">{ins.workflow?.config?.name || ins.workflowID || '—'}</td>
                      <td className="text-xs">{ins.terminated ? 'TERMINATED' : (ins.status || ins.state || 'RUNNING')}</td>
                      <td className="text-xs">{ins.createdAt ? new Date(ins.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <LiveAPIMonitor />
    </div>
  )
}

// Builder removed per latest requirements (JSON upload only)


