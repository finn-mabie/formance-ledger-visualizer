export interface AccountNode {
  id: string
  label: string
  elementId: string
  ledger?: string
  path?: string
  tags?: string[]
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface TxnEdge {
  id: string
  label: string
  elementId: string
  fromId: string
  toId: string
  metadata?: Record<string, any>
}

export interface NormalizedGraph {
  accounts: AccountNode[]
  transactions: TxnEdge[]
}

export interface MappingFile extends NormalizedGraph {
  diagramId: string
  version: 1
}

export function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function accountIdFromLabel(label: string): string {
  const trimmed = (label || '').trim()
  if (/\:/.test(trimmed)) return trimmed
  return `acct.${slugify(trimmed)}`
}

export function txnIdFromLabels(from: string, to: string, label?: string): string {
  if (label && label.trim()) return `txn.${slugify(label)}`
  return `txn.${slugify(`${from}_to_${to}`)}`
}

// Excalidraw element types
type ExcalidrawElement = any

export function parseExcalidraw(json: any): NormalizedGraph {
  const accounts: AccountNode[] = []
  const transactions: TxnEdge[] = []
  const idByElement: Record<string, string> = {}

  const elements: ExcalidrawElement[] = Array.isArray(json?.elements) ? json.elements : []

  // First pass: shapes -> accounts
  for (const el of elements) {
    const isShape = ['rectangle', 'ellipse', 'diamond', 'roundrectangle'].includes(el?.type)
    if (!isShape) continue
    const label = (el?.text || el?.rawText || '').trim() || 'unlabeled'
    const id = accountIdFromLabel(label)
    accounts.push({ id, label, elementId: el?.id, x: el?.x, y: el?.y, w: el?.width, h: el?.height })
    idByElement[el?.id] = id
  }

  // Second pass: arrows -> transactions
  for (const el of elements) {
    const isArrow = el?.type === 'arrow'
    if (!isArrow) continue
    const startId = el?.startBinding?.elementId || el?.start?.boundElementId
    const endId = el?.endBinding?.elementId || el?.end?.boundElementId
    let fromLabel = 'unknown_from'
    let toLabel = 'unknown_to'
    let fromId = idByElement[startId]
    let toId = idByElement[endId]

    if (!fromId || !toId) {
      // naive nearest-node fallback could be added; for now mark inferred ids
      if (!fromId) fromId = `acct.${slugify(fromLabel)}`
      if (!toId) toId = `acct.${slugify(toLabel)}`
    }

    const label = (el?.text || el?.rawText || '').trim()
    const txnId = txnIdFromLabels(fromId.replace(/^acct\./, ''), toId.replace(/^acct\./, ''), label)
    transactions.push({ id: txnId, label: label || `${fromId} → ${toId}`, elementId: el?.id, fromId, toId })
  }

  return { accounts, transactions }
}

export function mergeMapping(base: NormalizedGraph, mapping?: MappingFile): MappingFile {
  const diagramId = mapping?.diagramId || 'unknown-diagram'
  const accountsMap = new Map(base.accounts.map(a => [a.id, { ...a }]))
  const txMap = new Map(base.transactions.map(t => [t.id, { ...t }]))

  if (mapping) {
    for (const a of mapping.accounts || []) {
      const prev = accountsMap.get(a.id) || {}
      accountsMap.set(a.id, { ...prev, ...a })
    }
    for (const t of mapping.transactions || []) {
      const prev = txMap.get(t.id) || {}
      txMap.set(t.id, { ...prev, ...t })
    }
  }

  return {
    diagramId,
    version: 1,
    accounts: Array.from(accountsMap.values()),
    transactions: Array.from(txMap.values()),
  }
}


