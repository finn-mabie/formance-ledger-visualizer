import { useRef, useState, useMemo } from 'react'
import { parseExcalidraw, mergeMapping, type NormalizedGraph, type MappingFile } from '@/services/diagramAdapter'
import { Upload, FileJson, Search, ShieldCheck, Download, MousePointerClick } from 'lucide-react'
import { createTransaction } from '@/services/ledgerAdapter'
import { DiagramCanvas } from '@/components/DiagramCanvas'

export function DiagramImporter() {
  const diagramInput = useRef<HTMLInputElement>(null)
  const mappingInput = useRef<HTMLInputElement>(null)
  const [graph, setGraph] = useState<NormalizedGraph | null>(null)
  const [mapping, setMapping] = useState<MappingFile | null>(null)
  const [ledger, setLedger] = useState('cursor-test')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [status, setStatus] = useState<string>('')
  const [query, setQuery] = useState('')

  const merged = useMemo(() => (graph ? mergeMapping(graph, mapping || undefined) : null), [graph, mapping])

  const onUploadDiagram = async (file: File) => {
    const text = await file.text()
    const json = JSON.parse(text)
    const g = parseExcalidraw(json)
    setGraph(g)
  }

  const onUploadMapping = async (file: File) => {
    const text = await file.text()
    const json = JSON.parse(text) as MappingFile
    setMapping(json)
  }

  const saveMapping = () => {
    if (!merged) return
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mapping.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveGraph = () => {
    if (!graph) return
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const submitCredentials = async () => {
    setStatus('')
    await fetch('/api/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, clientSecret }) })
    const res = await fetch('/api/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ledger }) })
    const j = await res.json()
    setStatus(j?.ok ? `Connected to ${ledger}` : `Failed: ${j?.status || 'error'}`)
  }

  const filteredAccounts = useMemo(() => {
    if (!merged || !query) return merged?.accounts || []
    const q = query.toLowerCase()
    return merged.accounts.filter(a => a.id.toLowerCase().includes(q) || a.label.toLowerCase().includes(q))
  }, [merged, query])

  const filteredTxns = useMemo(() => {
    if (!merged || !query) return merged?.transactions || []
    const q = query.toLowerCase()
    return merged.transactions.filter(t => t.id.toLowerCase().includes(q) || t.label.toLowerCase().includes(q))
  }, [merged, query])

  const fireTransaction = async (t: any) => {
    try {
      // Interpret arrow click as transfer on the selected ledger.
      // Use colon-convention ids if already provided; otherwise fallback to labels
      const postings = [
        {
          source: (t.fromId?.replace(/^acct\./, '') || '').replace(/_/g, ':'),
          destination: (t.toId?.replace(/^acct\./, '') || '').replace(/_/g, ':'),
          amount: 1,
          asset: 'USD'
        }
      ]
      await createTransaction(ledger, { reference: t.label || t.id, postings, metadata: { source: 'diagram' } })
      setStatus(`Executed: ${t.id}`)
    } catch (e) {
      setStatus('Failed to execute transaction')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Diagram Importer</h1>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => diagramInput.current?.click()}><Upload className="h-4 w-4 mr-2"/>Upload .excalidraw</button>
          <input ref={diagramInput} type="file" accept=".excalidraw,application/json" className="hidden" onChange={(e) => e.target.files && onUploadDiagram(e.target.files[0])} />
          <button className="btn-secondary" onClick={() => mappingInput.current?.click()}><FileJson className="h-4 w-4 mr-2"/>Upload mapping.json</button>
          <input ref={mappingInput} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && onUploadMapping(e.target.files[0])} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center mb-4">
            <Search className="h-4 w-4 mr-2 text-gray-400"/>
            <input className="input" placeholder="Search accounts or transactions by id/label" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {!merged && (
            <div className="text-slate-400">Upload an .excalidraw file to parse.</div>
          )}
          {merged && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-200">Accounts ({merged.accounts.length})</h3>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {filteredAccounts.map(a => (
                    <div key={a.id} className="p-2 rounded border border-slate-700 hover:bg-slate-800">
                      <div className="font-mono text-xs text-slate-400">{a.id}</div>
                      <div className="text-sm text-slate-100">{a.label}</div>
                      <div className="text-xs text-slate-400">{a.ledger || '—'} {a.path ? `• ${a.path}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-200">Transactions ({merged.transactions.length})</h3>
                <div className="space-y-2 max-h-80 overflow-auto">
                  {filteredTxns.map(t => (
                    <div key={t.id} className="p-2 rounded border border-slate-700 hover:bg-slate-800">
                      <div className="font-mono text-xs text-slate-400">{t.id}</div>
                      <div className="text-sm text-slate-100">{t.label}</div>
                      <div className="text-xs text-slate-400">{t.fromId} → {t.toId}</div>
                      <button className="mt-2 btn-secondary" onClick={() => fireTransaction(t)}>
                        <MousePointerClick className="h-4 w-4 mr-2"/>Run in ledger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <DiagramCanvas graph={merged} onRunTransaction={(id) => {
                  const t = merged.transactions.find(x => x.id === id)
                  if (t) fireTransaction(t)
                }} />
              </div>
            </div>
          )}
        </div>
        <div className="card space-y-4">
          <div className="flex items-center text-slate-300"><ShieldCheck className="h-4 w-4 mr-2"/>Secure Credentials</div>
          <div>
            <label className="label">Ledger Name</label>
            <input className="input" value={ledger} onChange={(e) => setLedger(e.target.value)} placeholder="cursor-test" />
          </div>
          <div>
            <label className="label">Client ID</label>
            <input className="input" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Enter client id" />
          </div>
          <div>
            <label className="label">Client Secret</label>
            <input className="input" type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Enter client secret" />
          </div>
          <button className="btn-primary" onClick={submitCredentials}>Test connection</button>
          {status && <div className="text-sm text-slate-300">{status}</div>}
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={saveGraph}><Download className="h-4 w-4 mr-2"/>Download graph.json</button>
              <button className="btn-secondary" onClick={saveMapping}><Download className="h-4 w-4 mr-2"/>Download mapping.json</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


