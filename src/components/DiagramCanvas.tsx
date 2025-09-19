import { NormalizedGraph } from '@/services/diagramAdapter'
import { MousePointerClick } from 'lucide-react'
import { useRef, useState } from 'react'

interface Props {
  graph: NormalizedGraph
  onRunTransaction?: (txnId: string) => void
  onSelectArrow?: (txnId: string) => void
  onNodeMove?: (accountElementId: string, x: number, y: number) => void
  onSelectNode?: (accountElementId: string) => void
}

export function DiagramCanvas({ graph, onRunTransaction, onSelectArrow, onNodeMove, onSelectNode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null)
  const [selectedNodeElementId, setSelectedNodeElementId] = useState<string | null>(null)
  const width = Math.max(800, Math.max(...graph.accounts.map(a => (a.x||0)+(a.w||140))) + 100)
  const height = Math.max(600, Math.max(...graph.accounts.map(a => (a.y||0)+(a.h||60))) + 100)

  const findAccount = (id: string) => graph.accounts.find(a => a.id === id)
  const centerOf = (a: any) => ({ cx: (a.x||0) + (a.w||140)/2, cy: (a.y||0) + (a.h||60)/2 })
  const anchorOnRect = (from: any, to: any) => {
    // Return point on 'from' rectangle edge towards center of 'to'
    const fc = centerOf(from)
    const tc = centerOf(to)
    const dx = tc.cx - fc.cx
    const dy = tc.cy - fc.cy
    const hw = (from.w || 140) / 2
    const hh = (from.h || 60) / 2
    // Compute scale to hit vertical or horizontal side first
    const sx = dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(hw / dx)
    const sy = dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(hh / dy)
    const s = Math.min(sx, sy)
    return { x: fc.cx + dx * s, y: fc.cy + dy * s }
  }

  return (
    <div ref={containerRef} className="relative border border-slate-800 rounded overflow-auto bg-slate-950 select-none" style={{ height: 600 }}>
      <svg className="absolute inset-0" width={width} height={height}>
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
          const isSelected = selectedTxnId === id
          return (
            <g
              key={id}
              className="group"
              onClick={() => {
                setSelectedTxnId(id)
                if (onSelectArrow) onSelectArrow(id)
              }}
              style={{ cursor: onRunTransaction || onSelectArrow ? 'pointer' : 'default' }}
            >
              {isSelected && (
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(16,185,129,0.28)" strokeWidth={4} markerEnd="url(#arrowhead-selected)" />
              )}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isSelected ? '#10b981' : '#888'}
                strokeWidth={2}
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
                onDoubleClick={onRunTransaction ? () => onRunTransaction(id) : undefined}
              />
              {/* thicker invisible hit area for easier clicking */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={12} onDoubleClick={onRunTransaction ? () => onRunTransaction(id) : undefined} />
              <text x={(x1+x2)/2} y={(y1+y2)/2 - 6} fill={isSelected ? '#10b981' : '#555'} fontSize={12} textAnchor="middle">
                {t.label}
                {t.metadata?.amount ? ` (${t.metadata.amount} ${t.metadata?.asset || ''})` : ''}
              </text>
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
      </svg>
      <div style={{ width, height }} />
      {graph.accounts.map(a => {
        const startX = a.x || 0
        const startY = a.y || 0
        const onMouseDown = (e: React.MouseEvent) => {
          if (!onNodeMove) return
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
        const isSelectedNode = selectedNodeElementId === a.elementId
        return (
          <div key={a.elementId}
            className={`absolute rounded border transition cursor-move text-slate-100 ${isSelectedNode ? 'bg-slate-800/90 border-emerald-500 ring-2 ring-emerald-500/70 shadow-lg shadow-emerald-800/20' : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700'}`}
            style={{ left: (a.x||0), top: (a.y||0), width: (a.w||140), height: (a.h||60) }}
            onMouseDown={onMouseDown}
            onClick={(e) => { e.stopPropagation(); if (!dragging) { setSelectedNodeElementId(a.elementId); onSelectNode && onSelectNode(a.elementId) } }}
          >
            <div className="p-2 text-xs font-mono text-slate-400 truncate" title={a.id}>{a.id}</div>
            <div className="px-2 text-sm text-slate-100 truncate" title={a.label}>{a.label}</div>
          </div>
        )
      })}
      {onRunTransaction && (
        <div className="absolute right-2 top-2 text-xs text-slate-300 bg-slate-900/80 px-2 py-1 rounded shadow">
          Click a transaction row to run <MousePointerClick className="inline h-3 w-3"/>
        </div>
      )}
    </div>
  )
}


