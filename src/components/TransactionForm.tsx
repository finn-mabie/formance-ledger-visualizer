import { useState } from 'react'
import { Plus, X, DollarSign, User, Building2 } from 'lucide-react'
import { ledgerService } from '@/services/ledgerService'
import { Transaction } from '@/types/ledger'

interface Posting {
  source: string
  destination: string
  amount: number
  asset: string
}

interface TransactionFormProps {
  useCase: string
  onTransactionCreated?: (transaction: Transaction) => void
  onClose?: () => void
  className?: string
}

const ACCOUNT_OPTIONS = [
  { value: 'world', label: 'World (External)', type: 'external' },
  { value: 'centralbank', label: 'Central Bank', type: 'bank' },
  { value: 'customer:cust_01:fbo_cash:main', label: 'Customer 01 FBO Cash Main', type: 'customer' },
  { value: 'customer:cust_01:fbo_cash:pending', label: 'Customer 01 FBO Cash Pending', type: 'customer' },
  { value: 'customer:cust_01:wallet_funds:main', label: 'Customer 01 Wallet Funds', type: 'customer' },
  { value: 'customer:cust_01:bills:payable', label: 'Customer 01 Bills Payable', type: 'customer' },
  { value: 'customer:cust_01:interest:interest_earned', label: 'Customer 01 Interest Earned', type: 'customer' },
  { value: 'customer:cust_01:interest:interest_payable', label: 'Customer 01 Interest Payable', type: 'customer' },
  { value: 'vendor:salesforce:bills:b_01:payable', label: 'Salesforce Bills Payable', type: 'vendor' },
  { value: 'vendor:salesforce:bills:b_01:pending', label: 'Salesforce Bills Pending', type: 'vendor' },
  { value: 'platform:fees:bills', label: 'Platform Fees Bills', type: 'platform' },
  { value: 'platform:fees:customer:cust_01:bills:b_01:vendor:salesforce', label: 'Platform Fees Customer', type: 'platform' },
]

const USE_CASE_TEMPLATES = {
  banking: {
    title: 'Banking Transaction',
    description: 'Create a transfer, deposit, or withdrawal',
    defaultPostings: [
      { source: 'world', destination: 'customer:cust_01:fbo_cash:main', amount: 0, asset: 'USD' }
    ]
  },
  ecommerce: {
    title: 'E-commerce Transaction',
    description: 'Process a payment or order',
    defaultPostings: [
      { source: 'customer:cust_01:wallet_funds:main', destination: 'customer:cust_01:bills:payable', amount: 0, asset: 'USD' },
      { source: 'customer:cust_01:bills:payable', destination: 'platform:fees:bills', amount: 0, asset: 'USD' }
    ]
  },
  gaming: {
    title: 'Gaming Transaction',
    description: 'Process in-game purchase or reward',
    defaultPostings: [
      { source: 'customer:cust_01:wallet_funds:main', destination: 'customer:cust_01:interest:interest_earned', amount: 0, asset: 'USD' }
    ]
  },
  accounting: {
    title: 'Accounting Transaction',
    description: 'Record business expense or income',
    defaultPostings: [
      { source: 'customer:cust_01:fbo_cash:main', destination: 'customer:cust_01:bills:payable', amount: 0, asset: 'USD' }
    ]
  },
  marketplace: {
    title: 'Marketplace Transaction',
    description: 'Process multi-party transaction with fees',
    defaultPostings: [
      { source: 'customer:cust_01:wallet_funds:main', destination: 'vendor:salesforce:bills:b_01:pending', amount: 0, asset: 'USD' },
      { source: 'vendor:salesforce:bills:b_01:pending', destination: 'vendor:salesforce:bills:b_01:payable', amount: 0, asset: 'USD' },
      { source: 'customer:cust_01:bills:payable', destination: 'platform:fees:customer:cust_01:bills:b_01:vendor:salesforce', amount: 0, asset: 'USD' }
    ]
  }
}

export function TransactionForm({ 
  useCase, 
  onTransactionCreated, 
  onClose,
  className = '' 
}: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reference, setReference] = useState('')
  const [postings, setPostings] = useState<Posting[]>(
    USE_CASE_TEMPLATES[useCase as keyof typeof USE_CASE_TEMPLATES]?.defaultPostings || 
    [{ source: 'world', destination: 'customer:cust_01:fbo_cash:main', amount: 0, asset: 'USD' }]
  )

  const template = USE_CASE_TEMPLATES[useCase as keyof typeof USE_CASE_TEMPLATES]

  const addPosting = () => {
    setPostings([...postings, { source: 'world', destination: 'customer:cust_01:fbo_cash:main', amount: 0, asset: 'USD' }])
  }

  const removePosting = (index: number) => {
    if (postings.length > 1) {
      setPostings(postings.filter((_, i) => i !== index))
    }
  }

  const updatePosting = (index: number, field: keyof Posting, value: string | number) => {
    const updated = [...postings]
    updated[index] = { ...updated[index], [field]: value }
    setPostings(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const transaction = await ledgerService.createTransaction(
        postings,
        reference || `${template?.title || 'Transaction'} - ${new Date().toLocaleString()}`,
        { type: useCase, source: useCase }
      )
      
      onTransactionCreated?.(transaction)
      setIsOpen(false)
      setReference('')
      setPostings(template?.defaultPostings || [{ source: 'user:alice', destination: 'bank:main', amount: 0, asset: 'USD' }])
    } catch (error) {
      console.error('Failed to create transaction:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAccountIcon = (account: string) => {
    const accountType = ACCOUNT_OPTIONS.find(a => a.value === account)?.type
    switch (accountType) {
      case 'customer':
      case 'merchant':
        return <User className="h-4 w-4" />
      case 'bank':
      case 'revenue':
      case 'expense':
      case 'asset':
      case 'liability':
        return <Building2 className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Transaction
      </button>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{template?.title || 'Create Transaction'}</h3>
          <p className="text-sm text-gray-600">{template?.description || 'Create a new transaction'}</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Reference */}
        <div>
          <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
            Reference (Optional)
          </label>
          <input
            type="text"
            id="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Enter transaction reference..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Postings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Transaction Postings
            </label>
            <button
              type="button"
              onClick={addPosting}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Posting
            </button>
          </div>

          <div className="space-y-3">
            {postings.map((posting, index) => (
              <div key={index} className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-4 sm:gap-2 sm:items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Account</label>
                  <div className="relative">
                    <select
                      value={posting.source}
                      onChange={(e) => updatePosting(index, 'source', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {ACCOUNT_OPTIONS.map(account => (
                        <option key={account.value} value={account.value}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-2 top-2.5 text-gray-400">
                      {getAccountIcon(posting.source)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Account</label>
                  <div className="relative">
                    <select
                      value={posting.destination}
                      onChange={(e) => updatePosting(index, 'destination', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {ACCOUNT_OPTIONS.map(account => (
                        <option key={account.value} value={account.value}>
                          {account.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute left-2 top-2.5 text-gray-400">
                      {getAccountIcon(posting.destination)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                  <input
                    type="number"
                    value={posting.amount}
                    onChange={(e) => updatePosting(index, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Asset</label>
                    <select
                      value={posting.asset}
                      onChange={(e) => updatePosting(index, 'asset', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                  {postings.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePosting(index)}
                      className="p-2 text-red-400 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || postings.some(p => p.amount <= 0)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </div>
  )
}
