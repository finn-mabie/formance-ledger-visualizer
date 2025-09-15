import { Designer } from '@/pages/Designer'
import { AccountNode, TxnEdge } from '@/services/diagramAdapter'

// Vertical tree layout
const X_CENTER = 340
const ROW_H = 120
const BOX_W = 220
const BOX_H = 60

const initialAccounts: AccountNode[] = [
  { id: 'world', label: 'world', elementId: 'el_world', x: X_CENTER, y: 20, w: BOX_W, h: BOX_H },
  { id: 'order:123:pending', label: 'order:123:pending', elementId: 'el_order_pending', x: X_CENTER, y: 20 + ROW_H, w: BOX_W, h: BOX_H },
  { id: 'order:123:cleared', label: 'order:123:cleared', elementId: 'el_order_cleared', x: X_CENTER, y: 20 + ROW_H * 2, w: BOX_W, h: BOX_H },
  { id: 'order:123:vendor:01', label: 'order:123:vendor:01', elementId: 'el_order_vendor1', x: X_CENTER - 180, y: 20 + ROW_H * 3, w: BOX_W, h: BOX_H },
  { id: 'order:123:vendor:02', label: 'order:123:vendor:02', elementId: 'el_order_vendor2', x: X_CENTER + 180, y: 20 + ROW_H * 3, w: BOX_W, h: BOX_H },
  { id: 'vendor:01:wallet:main', label: 'vendor:01:wallet:main', elementId: 'el_vendor1_wallet', x: X_CENTER - 180, y: 20 + ROW_H * 4, w: BOX_W, h: BOX_H },
  { id: 'vendor:02:wallet:main', label: 'vendor:02:wallet:main', elementId: 'el_vendor2_wallet', x: X_CENTER + 180, y: 20 + ROW_H * 4, w: BOX_W, h: BOX_H },
]

const initialTransactions: TxnEdge[] = [
  // 1) world -> order:123:pending
  { id: 'txn.mkt_1', label: 'Fund order pending', elementId: 'ar_1', fromId: 'world', toId: 'order:123:pending', metadata: { asset: 'USD', amount: 100 } },
  // 2) order:123:pending -> order:123:cleared
  { id: 'txn.mkt_2', label: 'Order cleared', elementId: 'ar_2', fromId: 'order:123:pending', toId: 'order:123:cleared', metadata: { asset: 'USD', amount: 100 } },
  // 3) order:123:cleared -> order:123:vendor:01
  { id: 'txn.mkt_3', label: 'Allocate to vendor 01', elementId: 'ar_3', fromId: 'order:123:cleared', toId: 'order:123:vendor:01', metadata: { asset: 'USD', amount: 60 } },
  // 4) order:123:cleared -> order:123:vendor:02
  { id: 'txn.mkt_4', label: 'Allocate to vendor 02', elementId: 'ar_4', fromId: 'order:123:cleared', toId: 'order:123:vendor:02', metadata: { asset: 'USD', amount: 40 } },
  // 5) order:123:vendor:01 -> vendor:01:wallet:main
  { id: 'txn.mkt_5', label: 'Payout vendor 01', elementId: 'ar_5', fromId: 'order:123:vendor:01', toId: 'vendor:01:wallet:main', metadata: { asset: 'USD', amount: 60 } },
  // 6) order:123:vendor:02 -> vendor:02:wallet:main
  { id: 'txn.mkt_6', label: 'Payout vendor 02', elementId: 'ar_6', fromId: 'order:123:vendor:02', toId: 'vendor:02:wallet:main', metadata: { asset: 'USD', amount: 40 } },
]

export function Marketplace() {
  return (
    <Designer title="Marketplace" initialAccounts={initialAccounts} initialTransactions={initialTransactions} />
  )
}


