import React, { useState, useEffect } from 'react'
import { LiveAPIMonitor } from './LiveAPIMonitor'
import { 
  Database, 
  Code, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Copy,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface APICall {
  id: string
  method: string
  endpoint: string
  status: 'pending' | 'success' | 'error'
  timestamp: string
  request: any
  response?: any
  duration?: number
}

interface BackendLedgerViewProps {
  useCase: string
  transactionId?: string
  showLiveAPI?: boolean
}

const mockAPICalls: APICall[] = [
  {
    id: 'api_001',
    method: 'POST',
    endpoint: '/api/ledger/v2/ledgers/default/transactions',
    status: 'success',
    timestamp: '2024-01-16T10:30:00.123Z',
    duration: 45,
    request: {
      postings: [
        {
          source: 'user:alice',
          destination: 'bank:main',
          amount: 100,
          asset: 'USD'
        }
      ],
      reference: 'Payment from Alice',
      metadata: {
        type: 'payment',
        source: 'ecommerce'
      }
    },
    response: {
      data: {
        id: 'tx_001',
        timestamp: '2024-01-16T10:30:00.123Z',
        reference: 'Payment from Alice',
        postings: [
          {
            source: 'user:alice',
            destination: 'bank:main',
            amount: 100,
            asset: 'USD'
          }
        ],
        metadata: {
          type: 'payment',
          source: 'ecommerce'
        }
      }
    }
  },
  {
    id: 'api_002',
    method: 'GET',
    endpoint: '/api/ledger/v2/ledgers/default/accounts',
    status: 'success',
    timestamp: '2024-01-16T10:30:01.234Z',
    duration: 23,
    request: {},
    response: {
      data: [
        { address: 'user:alice', metadata: { name: 'Alice Johnson' } },
        { address: 'bank:main', metadata: { name: 'Main Bank Account' } }
      ]
    }
  },
  {
    id: 'api_003',
    method: 'GET',
    endpoint: '/api/ledger/v2/ledgers/default/balances',
    status: 'success',
    timestamp: '2024-01-16T10:30:02.345Z',
    duration: 18,
    request: {},
    response: {
      data: [
        { account: 'user:alice', asset: 'USD', balance: 150 },
        { account: 'bank:main', asset: 'USD', balance: 50000 }
      ]
    }
  }
]

export function BackendLedgerView({ useCase, transactionId, showLiveAPI = true }: BackendLedgerViewProps) {
  const [apiCalls, setApiCalls] = useState<APICall[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentCallIndex, setCurrentCallIndex] = useState(0)

  useEffect(() => {
    if (showLiveAPI && isPlaying) {
      const interval = setInterval(() => {
        setCurrentCallIndex(prev => {
          if (prev < mockAPICalls.length - 1) {
            setApiCalls(prevCalls => [...prevCalls, mockAPICalls[prev]])
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isPlaying, showLiveAPI])

  const startDemo = () => {
    setApiCalls([])
    setCurrentCallIndex(0)
    setIsPlaying(true)
  }

  const stopDemo = () => {
    setIsPlaying(false)
  }

  const resetDemo = () => {
    setApiCalls([])
    setCurrentCallIndex(0)
    setIsPlaying(false)
  }

  const getStatusIcon = (status: APICall['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: APICall['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Backend Ledger View</h3>
          <span className="text-sm text-gray-500">({useCase})</span>
        </div>
      </div>

      {/* Live API Monitor */}
      <div className="flex-1">
        <LiveAPIMonitor />
      </div>

      {/* Ledger State */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Ledger State:</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-medium">Accounts:</span>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between">
                <span>user:alice</span>
                <span className="text-green-600">$150</span>
              </div>
              <div className="flex justify-between">
                <span>bank:main</span>
                <span className="text-green-600">$50,000</span>
              </div>
            </div>
          </div>
          <div>
            <span className="font-medium">Recent Transactions:</span>
            <div className="mt-1 space-y-1">
              <div className="text-gray-600">tx_001: Payment</div>
              <div className="text-gray-600">tx_002: Transfer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
