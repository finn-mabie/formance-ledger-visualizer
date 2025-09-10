import { Transaction } from '@/types/ledger'
import { format } from 'date-fns'
import { ArrowRight, Clock, DollarSign } from 'lucide-react'

interface TransactionListProps {
  transactions: Transaction[]
  loading?: boolean
  title?: string
  showAccountDetails?: boolean
}

export function TransactionList({ 
  transactions, 
  loading = false, 
  title = "Recent Transactions",
  showAccountDetails = true 
}: TransactionListProps) {
  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions found</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {transaction.reference || 'Transaction'}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {transaction.metadata?.type || 'payment'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(transaction.timestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {transaction.id}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${transaction.postings.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {transaction.postings.length} posting{transaction.postings.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              
              {showAccountDetails && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="space-y-2">
                    {transaction.postings.map((posting, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="text-gray-600 font-medium">{posting.source}</span>
                        <ArrowRight className="h-3 w-3 mx-2 text-gray-400" />
                        <span className="text-gray-600 font-medium">{posting.destination}</span>
                        <div className="ml-auto flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="font-medium">{posting.amount} {posting.asset}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
