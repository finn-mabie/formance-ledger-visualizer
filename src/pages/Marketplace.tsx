import { Designer } from '@/pages/Designer'
import { AccountNode, TxnEdge } from '@/services/diagramAdapter'

const initialAccounts: AccountNode[] = [
  { id: 'world', label: 'world', elementId: 'el_world', x: 40, y: 40, w: 160, h: 60 },
  { id: 'user:buyer', label: 'user:buyer', elementId: 'el_buyer', x: 120, y: 220, w: 160, h: 60 },
  { id: 'user:seller', label: 'user:seller', elementId: 'el_seller', x: 540, y: 220, w: 160, h: 60 },
  { id: 'platform:escrow', label: 'platform:escrow', elementId: 'el_escrow', x: 330, y: 120, w: 180, h: 60 },
  { id: 'platform:fees', label: 'platform:fees', elementId: 'el_fees', x: 330, y: 320, w: 160, h: 60 },
  { id: 'bank:main', label: 'bank:main', elementId: 'el_bank', x: 330, y: 440, w: 160, h: 60 },
]

const initialTransactions: TxnEdge[] = [
  // Buyer funds escrow
  { id: 'txn.mkt_1', label: 'Buyer funds escrow', elementId: 'ar_1', fromId: 'user:buyer', toId: 'platform:escrow', metadata: { asset: 'USD', amount: 100 } },
  // Platform takes fee
  { id: 'txn.mkt_2', label: 'Platform fee', elementId: 'ar_2', fromId: 'platform:escrow', toId: 'platform:fees', metadata: { asset: 'USD', amount: 10 } },
  // Release to seller
  { id: 'txn.mkt_3', label: 'Payout seller', elementId: 'ar_3', fromId: 'platform:escrow', toId: 'user:seller', metadata: { asset: 'USD', amount: 90 } },
  // Platform settles to bank (optional)
  { id: 'txn.mkt_4', label: 'Settle fees to bank', elementId: 'ar_4', fromId: 'platform:fees', toId: 'bank:main', metadata: { asset: 'USD', amount: 10 } },
]

export function Marketplace() {
  return (
    <Designer title="Marketplace" initialAccounts={initialAccounts} initialTransactions={initialTransactions} />
  )
}


