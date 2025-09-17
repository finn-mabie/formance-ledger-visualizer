import { useState, useEffect } from 'react'
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Code, 
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface LiveAPICall {
  id: string
  method: string
  endpoint: string
  status: 'pending' | 'success' | 'error'
  timestamp: string
  duration: number
  request: any
  response?: any
  statusCode: number
}

const mockAPICalls: Omit<LiveAPICall, 'id' | 'timestamp' | 'duration'>[] = [
  {
    method: 'POST',
    endpoint: '/api/ledger/v2/ledgers/default/transactions',
    status: 'success',
    statusCode: 201,
    request: {
      postings: [
        {
          source: 'user:alice',
          destination: 'bank:main',
          amount: 100,
          asset: 'USD'
        }
      ],
      reference: 'E-commerce Payment',
      metadata: {
        type: 'payment',
        source: 'ecommerce',
        order_id: 'ORD-001'
      }
    },
    response: {
      data: {
        id: 'tx_001',
        timestamp: '2024-01-16T10:30:00.123Z',
        reference: 'E-commerce Payment',
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
          source: 'ecommerce',
          order_id: 'ORD-001'
        }
      }
    }
  },
  {
    method: 'GET',
    endpoint: '/api/ledger/v2/ledgers/default/accounts',
    status: 'success',
    statusCode: 200,
    request: {
      limit: 50
    },
    response: {
      data: [
        { address: 'user:alice', metadata: { name: 'Alice Johnson', type: 'customer' } },
        { address: 'bank:main', metadata: { name: 'Main Bank Account', type: 'bank' } },
        { address: 'revenue:sales', metadata: { name: 'Sales Revenue', type: 'revenue' } }
      ]
    }
  },
  {
    method: 'GET',
    endpoint: '/api/ledger/v2/ledgers/default/balances',
    status: 'success',
    statusCode: 200,
    request: {
      address: 'user:alice'
    },
    response: {
      data: [
        { account: 'user:alice', asset: 'USD', balance: 150 }
      ]
    }
  },
  {
    method: 'POST',
    endpoint: '/api/ledger/v2/ledgers/default/transactions',
    status: 'success',
    statusCode: 201,
    request: {
      postings: [
        {
          source: 'bank:main',
          destination: 'revenue:sales',
          amount: 100,
          asset: 'USD'
        }
      ],
      reference: 'Revenue Recognition',
      metadata: {
        type: 'revenue',
        source: 'ecommerce',
        order_id: 'ORD-001'
      }
    },
    response: {
      data: {
        id: 'tx_002',
        timestamp: '2024-01-16T10:30:01.234Z',
        reference: 'Revenue Recognition',
        postings: [
          {
            source: 'bank:main',
            destination: 'revenue:sales',
            amount: 100,
            asset: 'USD'
          }
        ]
      }
    }
  }
]

type LiveAPIMonitorProps = {
  title?: string
  baseEndpoint?: string
  filterPrefix?: string // only show calls whose endpoint starts with this prefix (e.g., '/api/payments/v3')
}

export function LiveAPIMonitor({
  title = 'Formance Ledger v2',
  baseEndpoint = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/ledger/v2',
  filterPrefix
}: LiveAPIMonitorProps) {
  const [apiCalls, setApiCalls] = useState<LiveAPICall[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail || {}
      if (filterPrefix && typeof d.endpoint === 'string' && !d.endpoint.includes(filterPrefix)) {
        return
      }
      const call: LiveAPICall = {
        id: `api_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        method: d.method || 'GET',
        endpoint: d.endpoint || '',
        status: d.status || 'pending',
        timestamp: new Date().toISOString(),
        duration: Math.round(d.duration || 0),
        request: d.request ?? null,
        response: d.response,
        statusCode: typeof d.statusCode === 'number' ? d.statusCode : 0,
      }
      setApiCalls(prev => [call, ...prev].slice(0, 200))
    }
    window.addEventListener('api-call' as any, handler as any)
    return () => window.removeEventListener('api-call' as any, handler as any)
  }, [])

  useEffect(() => {
    if (isPlaying && currentIndex < mockAPICalls.length) {
      const timer = setTimeout(() => {
        const call = mockAPICalls[currentIndex]
        const newCall: LiveAPICall = {
          ...call,
          id: `api_${Date.now()}_${currentIndex}`,
          timestamp: new Date().toISOString(),
          duration: Math.floor(Math.random() * 100) + 20
        }
        
        setApiCalls(prev => [newCall, ...prev])
        setCurrentIndex(prev => prev + 1)
      }, 2000)

      return () => clearTimeout(timer)
    } else if (currentIndex >= mockAPICalls.length) {
      setIsPlaying(false)
    }
  }, [isPlaying, currentIndex])

  const startDemo = () => {
    setApiCalls([])
    setCurrentIndex(0)
    setIsPlaying(true)
  }

  const stopDemo = () => {
    setIsPlaying(false)
  }

  const resetDemo = () => {
    setApiCalls([])
    setCurrentIndex(0)
    setIsPlaying(false)
  }

  const getStatusIcon = (status: LiveAPICall['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: LiveAPICall['status'], statusCode: number) => {
    if (status === 'error' || statusCode >= 400) {
      return 'border-red-700 bg-red-900/20'
    }
    if (statusCode >= 200 && statusCode < 300) {
      return 'border-emerald-700 bg-emerald-900/20'
    }
    return 'border-yellow-700 bg-yellow-900/20'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-medium text-slate-100">Live API Monitor</h3>
          <span className="text-sm text-slate-400">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={isPlaying ? stopDemo : startDemo}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isPlaying ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={resetDemo}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-slate-700 text-white rounded-md hover:bg-slate-600"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* API Endpoint Info */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-sm">
          <Code className="h-4 w-4 text-slate-300" />
          <span className="font-medium text-slate-200">API Endpoint:</span>
          <code className="bg-slate-800 px-2 py-1 rounded-md text-slate-200 text-xs">{baseEndpoint}</code>
        </div>
      </div>

      {/* Stats (moved to top above list) */}
      <div className="border-b border-slate-800 p-4 bg-slate-900/80">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-100">{apiCalls.length}</div>
            <div className="text-xs text-slate-400">Total Calls</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {apiCalls.filter(c => c.status === 'success').length}
            </div>
            <div className="text-xs text-slate-400">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">
              {apiCalls.length > 0 ? Math.round(apiCalls.reduce((sum, c) => sum + c.duration, 0) / apiCalls.length) : 0}ms
            </div>
            <div className="text-xs text-slate-400">Avg Response</div>
          </div>
        </div>
      </div>

      {/* API Calls List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {apiCalls.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p>Calls will appear here as you interact with the app</p>
          </div>
        ) : (
          apiCalls.map((call) => (
            <div
              key={call.id}
              className={`p-4 rounded-md border ${getStatusColor(call.status, call.statusCode)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(call.status)}
                  <span className="font-mono text-sm font-medium">
                    {call.method} {call.endpoint}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    call.statusCode >= 200 && call.statusCode < 300 
                      ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700' 
                      : 'bg-red-900/30 text-red-300 border border-red-700'
                  }`}>
                    {call.statusCode}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{call.duration}ms</span>
                  <span>•</span>
                  <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Request/Response */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Request:</h4>
                  <div className="bg-slate-900 text-emerald-300 p-3 rounded-md text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(call.request, null, 2)}</pre>
                  </div>
                </div>

                {call.response && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Response:</h4>
                    <div className="bg-slate-900 text-emerald-300 p-3 rounded-md text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(call.response, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* (Footer stats removed since stats now show above the list) */}
    </div>
  )
}
