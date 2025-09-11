import { NormalizedGraph, AccountNode, TxnEdge } from '@/services/diagramAdapter'
import { MousePointerClick } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

interface Props {
  graph: NormalizedGraph
  onRunTransaction?: (txnId: string) => void
  onSelectArrow?: (txnId: string) => void
  onNodeMove?: (accountElementId: string, x: number, y: number) => void
  onSelectNode?: (accountElementId: string) => void
  onUpdateAccount?: (elementId: string, updates: Partial<AccountNode>) => void
  onUpdateTransaction?: (id: string, updates: Partial<TxnEdge>) => void
  arrowMode?: boolean
  arrowFrom?: string | null
  selectedTxnId?: string | null
  selectedNodeElementId?: string | null
  balances?: Record<string, Record<string, number>>
  animateTxnId?: string | null
  animateNonce?: number
}

export function EditableDiagramCanvas({ 
  graph, 
  onRunTransaction, 
  onSelectArrow, 
  onNodeMove, 
  onSelectNode,
  onUpdateAccount,
  onUpdateTransaction,
  arrowMode = false,
  arrowFrom = null,
  selectedTxnId = null,
  selectedNodeElementId = null,
  balances,
  animateTxnId = null,
  animateNonce
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingTxn, setEditingTxn] = useState<string | null>(null)
  const [tempAccountLabel, setTempAccountLabel] = useState('')
  const [tempAccountId, setTempAccountId] = useState('')
  const [tempTxnAmount, setTempTxnAmount] = useState('')
  const [tempTxnAsset, setTempTxnAsset] = useState('')
  const [anim, setAnim] = useState<{ x1: number; y1: number; x2: number; y2: number; start: number; duration: number } | null>(null)
  const [animProgress, setAnimProgress] = useState(0)
  
  const width = Math.max(800, Math.max(...graph.accounts.map(a => (a.x||0)+(a.w||140))) + 100)
  const height = Math.max(600, Math.max(...graph.accounts.map(a => (a.y||0)+(a.h||60))) + 100)

  const findAccount = (id: string) => graph.accounts.find(a => a.id === id)
  const centerOf = (a: any) => ({ cx: (a.x||0) + (a.w||140)/2, cy: (a.y||0) + (a.h||60)/2 })
  const anchorOnRect = (from: any, to: any) => {
    const fc = centerOf(from)
    const tc = centerOf(to)
    const dx = tc.cx - fc.cx
    const dy = tc.cy - fc.cy
    const hw = (from.w || 140) / 2
    const hh = (from.h || 60) / 2
    const sx = dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(hw / dx)
    const sy = dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(hh / dy)
    const s = Math.min(sx, sy)
    return { x: fc.cx + dx * s, y: fc.cy + dy * s }
  }

  // Trigger animation when requested by parent
  useEffect(() => {
    if (!animateTxnId) return
    const t = graph.transactions.find(tx => tx.id === animateTxnId)
    if (!t) return
    const from = findAccount(t.fromId)
    const to = findAccount(t.toId)
    if (!from || !to) return
    const a1 = anchorOnRect(from, to)
    const a2 = anchorOnRect(to, from)
    setAnim({ x1: a1.x, y1: a1.y, x2: a2.x, y2: a2.y, start: performance.now(), duration: 900 })
    setAnimProgress(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateTxnId, animateNonce])

  useEffect(() => {
    if (!anim) return
    let raf = 0
    const step = (ts: number) => {
      const p = Math.min(1, (ts - anim.start) / anim.duration)
      setAnimProgress(p)
      if (p < 1) {
        raf = requestAnimationFrame(step)
      } else {
        setAnim(null)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [anim])

  const startEditingAccountLabel = (e: React.MouseEvent, account: AccountNode) => {
    e.stopPropagation()
    setEditingAccount(account.elementId)
    setTempAccountLabel(account.label || account.id)
  }

  const saveAccountLabelEdit = (account: AccountNode) => {
    if (onUpdateAccount && tempAccountLabel.trim()) {
      onUpdateAccount(account.elementId, { label: tempAccountLabel.trim() })
    }
    setEditingAccount(null)
  }

  const startEditingAccountId = (e: React.MouseEvent, account: AccountNode) => {
    e.stopPropagation()
    setEditingAccountId(account.elementId)
    setTempAccountId(account.id)
  }

  const saveAccountIdEdit = (account: AccountNode) => {
    if (onUpdateAccount && tempAccountId.trim()) {
      onUpdateAccount(account.elementId, { id: tempAccountId.trim() })
    }
    setEditingAccountId(null)
  }

  const startEditingTxn = (e: React.MouseEvent, txn: TxnEdge) => {
    e.stopPropagation()
    setEditingTxn(txn.id)
    setTempTxnAmount(String(txn.metadata?.amount || ''))
    setTempTxnAsset(txn.metadata?.asset || 'USD')
  }

  const saveTxnEdit = (txn: TxnEdge) => {
    if (onUpdateTransaction) {
      const amount = parseFloat(tempTxnAmount) || 0
      onUpdateTransaction(txn.id, { 
        metadata: { ...txn.metadata, amount, asset: tempTxnAsset || 'USD' }
      })
    }
    setEditingTxn(null)
  }

  return (
    <div ref={containerRef} className="relative border border-slate-800 rounded overflow-auto bg-slate-950" style={{ height: 600 }}>
      <svg className="absolute inset-0 z-0" width={width} height={height}>
        {graph.transactions.map(t => {
          const from = findAccount(t.fromId)
          const to = findAccount(t.toId)
          if (!from || !to) return null
          const a1 = anchorOnRect(from, to)
          const a2 = anchorOnRect(to, from)
          const x1 = a1.x
          const y1 = a1.y
          const x2 = a2.x
          const y2 = a2.y
          const id = t.id
          const isEditing = editingTxn === id
          const isSelected = selectedTxnId === id
          
          return (
            <g key={id} className="group" onClick={onSelectArrow ? () => onSelectArrow(id) : undefined} style={{ cursor: onRunTransaction || onSelectArrow ? 'pointer' : 'default' }}>
              {isSelected && (
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(16,185,129,0.28)" strokeWidth={4}
                  markerEnd="url(#arrowhead-selected)"
                />
              )}
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isSelected ? '#10b981' : '#94a3b8'} strokeWidth={2.5}
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
              />
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="transparent" strokeWidth={12}
              />
              {!isEditing ? (
                <text 
                  x={(x1+x2)/2} 
                  y={(y1+y2)/2 - 6} 
                  fill={isSelected ? '#10b981' : '#94a3b8'} 
                  fontSize={12} 
                  textAnchor="middle"
                  onDoubleClick={(e) => startEditingTxn(e, t)}
                  className="cursor-text"
                >
                  {t.label}{t.metadata?.amount ? ` (${t.metadata.amount} ${t.metadata?.asset || ''})` : ''}
                </text>
              ) : (
                <foreignObject x={(x1+x2)/2 - 80} y={(y1+y2)/2 - 20} width="160" height="40">
                  <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-slate-100">
                    <input
                      className="w-16 text-xs px-1 border border-slate-700 rounded bg-slate-800 text-slate-100"
                      value={tempTxnAmount}
                      onChange={(e) => setTempTxnAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTxnEdit(t)
                        if (e.key === 'Escape') setEditingTxn(null)
                      }}
                      onBlur={() => saveTxnEdit(t)}
                      placeholder="Amount"
                      autoFocus
                    />
                    <input
                      className="w-16 text-xs px-1 border border-slate-700 rounded bg-slate-800 text-slate-100"
                      value={tempTxnAsset}
                      onChange={(e) => setTempTxnAsset(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTxnEdit(t)
                        if (e.key === 'Escape') setEditingTxn(null)
                      }}
                      onBlur={() => saveTxnEdit(t)}
                      placeholder="Asset"
                    />
                  </div>
                </foreignObject>
              )}
            </g>
          )
        })}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
          </marker>
          <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
        </defs>
        {anim && (
          (() => {
            const cx = anim.x1 + (anim.x2 - anim.x1) * animProgress
            const cy = anim.y1 + (anim.y2 - anim.y1) * animProgress
            return (
              <g>
                <circle cx={cx} cy={cy} r={6} fill="#10b981" opacity={0.9} />
                <circle cx={cx} cy={cy} r={12} fill="#10b981" opacity={0.15} />
              </g>
            )
          })()
        )}
      </svg>
      <div style={{ width, height }} />
      {graph.accounts.map(a => {
        const isEditingLabel = editingAccount === a.elementId
        const isEditingId = editingAccountId === a.elementId
        const isEditing = isEditingLabel || isEditingId
        const isSelectedNode = selectedNodeElementId === a.elementId
        const acctBalances = balances && a.id ? balances[a.id] : undefined
        let primaryBalance: string = '—'
        if (acctBalances && Object.keys(acctBalances).length > 0) {
          // Prefer USD-like assets if present, otherwise take the first
          const preferred = Object.entries(acctBalances).find(([asset]) => /USD/i.test(asset)) || Object.entries(acctBalances)[0]
          if (preferred) {
            const [asset, bal] = preferred
            primaryBalance = `${asset}: ${bal}`
          }
        }
        const onMouseDown = (e: React.MouseEvent) => {
          if (!onNodeMove || isEditing) return
          e.preventDefault()
          e.stopPropagation()
          const container = containerRef.current
          const scrollLeft = container ? container.scrollLeft : 0
          const scrollTop = container ? container.scrollTop : 0
          const originX = e.clientX + scrollLeft
          const originY = e.clientY + scrollTop
          const baseX = a.x || 0
          const baseY = a.y || 0
          setDragging(a.elementId)
          const onMove = (ev: MouseEvent) => {
            const containerNow = containerRef.current
            const sl = containerNow ? containerNow.scrollLeft : 0
            const st = containerNow ? containerNow.scrollTop : 0
            const dx = (ev.clientX + sl) - originX
            const dy = (ev.clientY + st) - originY
            onNodeMove(a.elementId, baseX + dx, baseY + dy)
          }
          const onUp = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
            setDragging(null)
          }
          window.addEventListener('mousemove', onMove)
          window.addEventListener('mouseup', onUp)
        }
        
        const isArrowSource = arrowMode && arrowFrom === a.elementId
        const isArrowCandidate = arrowMode && !arrowFrom
        
        return (
          <div key={a.elementId}
            className={`absolute rounded border transition text-slate-100 ${
              isArrowSource ? 'bg-emerald-900/30 border-emerald-500 ring-2 ring-emerald-500/60' : 
              isSelectedNode ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/70 shadow-lg shadow-emerald-800/20' :
              isArrowCandidate ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' :
              'bg-slate-800/80 hover:bg-slate-700 border-slate-700'
            }`}
            style={{ 
              left: (a.x||0), 
              top: (a.y||0), 
              width: (a.w||160), 
              height: (a.h||60),
              cursor: arrowMode ? 'pointer' : (isEditing ? 'text' : 'move')
            }}
            onMouseDown={onMouseDown}
            onClick={(e) => { e.stopPropagation(); onSelectNode && !dragging && onSelectNode(a.elementId) }}
          >
            {!isEditingId ? (
              <div 
                className="p-2 text-xs font-mono text-slate-300 cursor-text" 
                onDoubleClick={(e) => startEditingAccountId(e, a)}
              >
                {a.id || 'ledger-name'}
              </div>
            ) : (
              <div className="p-2">
                <input
                  className="w-full text-xs font-mono px-1 border border-slate-700 rounded bg-slate-800 text-slate-100"
                  value={tempAccountId}
                  onChange={(e) => setTempAccountId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveAccountIdEdit(a)
                    if (e.key === 'Escape') setEditingAccountId(null)
                  }}
                  onBlur={() => saveAccountIdEdit(a)}
                  autoFocus
                />
              </div>
            )}
            <div className="px-2 pb-2 text-[11px] text-slate-400">
              {primaryBalance}
            </div>
          </div>
        )
      })}
      {onRunTransaction && !arrowMode && (
        <div className="absolute right-2 top-2 text-xs text-slate-300 bg-slate-900/80 px-2 py-1 rounded shadow">
          Select arrow then press Enter to run
        </div>
      )}
      {arrowMode && (
        <div className="absolute right-2 top-2 text-xs bg-emerald-600 text-white px-3 py-2 rounded shadow">
          {arrowFrom ? 'Click destination account' : 'Click source account'}
        </div>
      )}
    </div>
  )
}
