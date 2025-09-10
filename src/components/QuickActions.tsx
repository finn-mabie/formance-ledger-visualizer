import { useState } from 'react'
import { 
  Plus, 
  CreditCard, 
  DollarSign, 
  ArrowRightLeft, 
  ShoppingCart,
  Gamepad2,
  Calculator,
  Store,
  Building2
} from 'lucide-react'
import { ledgerService } from '@/services/ledgerService'
import { Transaction } from '@/types/ledger'

interface QuickActionsProps {
  useCase: string
  onTransactionCreated?: (transaction: Transaction) => void
  className?: string
}

const QUICK_ACTIONS = {
  banking: [
    {
      id: 'deposit',
      title: 'Deposit',
      description: 'Add money to customer account',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-green-500',
      action: () => ({
        postings: [
          { source: 'world', destination: 'customer:cust_01:fbo_cash:main', amount: 100, asset: 'USD' }
        ],
        reference: 'Deposit to customer account',
        metadata: { type: 'deposit', source: 'banking' }
      })
    },
    {
      id: 'withdrawal',
      title: 'Withdrawal',
      description: 'Remove money from account',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      color: 'bg-red-500',
      action: () => ({
        postings: [
          { source: 'customer:cust_01:fbo_cash:main', destination: 'world', amount: 50, asset: 'USD' }
        ],
        reference: 'Withdrawal from customer account',
        metadata: { type: 'withdrawal', source: 'banking' }
      })
    },
    {
      id: 'transfer',
      title: 'Transfer',
      description: 'Move money between accounts',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-blue-500',
      action: () => ({
        postings: [
          { source: 'customer:cust_01:fbo_cash:main', destination: 'customer:cust_01:wallet_funds:main', amount: 25, asset: 'USD' }
        ],
        reference: 'Transfer between customer accounts',
        metadata: { type: 'transfer', source: 'banking' }
      })
    }
  ],
  ecommerce: [
    {
      id: 'purchase',
      title: 'Purchase',
      description: 'Customer buys product',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'bg-blue-500',
      action: () => ({
        postings: [
          { source: 'user:alice', destination: 'bank:main', amount: 75, asset: 'USD' },
          { source: 'bank:main', destination: 'revenue:sales', amount: 75, asset: 'USD' }
        ],
        reference: 'Product purchase by Alice',
        metadata: { type: 'purchase', source: 'ecommerce' }
      })
    },
    {
      id: 'refund',
      title: 'Refund',
      description: 'Return money to customer',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      color: 'bg-orange-500',
      action: () => ({
        postings: [
          { source: 'revenue:sales', destination: 'bank:main', amount: 25, asset: 'USD' },
          { source: 'bank:main', destination: 'user:alice', amount: 25, asset: 'USD' }
        ],
        reference: 'Refund to Alice',
        metadata: { type: 'refund', source: 'ecommerce' }
      })
    },
    {
      id: 'commission',
      title: 'Commission',
      description: 'Platform fee collection',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-purple-500',
      action: () => ({
        postings: [
          { source: 'revenue:sales', destination: 'revenue:commission', amount: 7.5, asset: 'USD' }
        ],
        reference: 'Platform commission',
        metadata: { type: 'commission', source: 'ecommerce' }
      })
    }
  ],
  gaming: [
    {
      id: 'purchase',
      title: 'In-Game Purchase',
      description: 'Buy virtual items',
      icon: <Gamepad2 className="h-5 w-5" />,
      color: 'bg-orange-500',
      action: () => ({
        postings: [
          { source: 'user:alice', destination: 'bank:main', amount: 15, asset: 'USD' },
          { source: 'bank:main', destination: 'revenue:gaming', amount: 15, asset: 'USD' }
        ],
        reference: 'In-game purchase by Alice',
        metadata: { type: 'gaming_purchase', source: 'gaming' }
      })
    },
    {
      id: 'reward',
      title: 'Reward',
      description: 'Give player rewards',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-green-500',
      action: () => ({
        postings: [
          { source: 'revenue:gaming', destination: 'user:alice', amount: 5, asset: 'USD' }
        ],
        reference: 'Gaming reward for Alice',
        metadata: { type: 'reward', source: 'gaming' }
      })
    }
  ],
  accounting: [
    {
      id: 'expense',
      title: 'Record Expense',
      description: 'Log business expense',
      icon: <Calculator className="h-5 w-5" />,
      color: 'bg-red-500',
      action: () => ({
        postings: [
          { source: 'bank:main', destination: 'expense:marketing', amount: 200, asset: 'USD' }
        ],
        reference: 'Marketing expense',
        metadata: { type: 'expense', source: 'accounting' }
      })
    },
    {
      id: 'revenue',
      title: 'Record Revenue',
      description: 'Log business income',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-green-500',
      action: () => ({
        postings: [
          { source: 'revenue:sales', destination: 'bank:main', amount: 1000, asset: 'USD' }
        ],
        reference: 'Sales revenue',
        metadata: { type: 'revenue', source: 'accounting' }
      })
    }
  ],
  marketplace: [
    {
      id: 'sale',
      title: 'Marketplace Sale',
      description: 'Multi-party transaction',
      icon: <Store className="h-5 w-5" />,
      color: 'bg-blue-500',
      action: () => ({
        postings: [
          { source: 'user:alice', destination: 'bank:main', amount: 100, asset: 'USD' },
          { source: 'bank:main', destination: 'user:charlie', amount: 90, asset: 'USD' },
          { source: 'bank:main', destination: 'revenue:marketplace', amount: 10, asset: 'USD' }
        ],
        reference: 'Marketplace sale with commission',
        metadata: { type: 'marketplace_sale', source: 'marketplace' }
      })
    },
    {
      id: 'escrow',
      title: 'Escrow Release',
      description: 'Release held funds',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-purple-500',
      action: () => ({
        postings: [
          { source: 'liability:escrow', destination: 'user:charlie', amount: 50, asset: 'USD' }
        ],
        reference: 'Escrow release to Charlie',
        metadata: { type: 'escrow_release', source: 'marketplace' }
      })
    }
  ]
}

export function QuickActions({ useCase, onTransactionCreated, className = '' }: QuickActionsProps) {
  const [isCreating, setIsCreating] = useState<string | null>(null)

  const actions = QUICK_ACTIONS[useCase as keyof typeof QUICK_ACTIONS] || []

  const handleQuickAction = async (action: typeof actions[0]) => {
    setIsCreating(action.id)
    
    try {
      const { postings, reference, metadata } = action.action()
      const transaction = await ledgerService.createTransaction(postings, reference, metadata)
      onTransactionCreated?.(transaction)
    } catch (error) {
      console.error('Failed to create transaction:', error)
    } finally {
      setIsCreating(null)
    }
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h3>
        <p className="text-sm text-gray-600">Create common transactions with one click</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action)}
            disabled={isCreating === action.id}
            className={`relative p-3 sm:p-4 text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 ${action.color} rounded-lg flex items-center justify-center text-white`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {action.description}
                </p>
              </div>
            </div>
            {isCreating === action.id && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
