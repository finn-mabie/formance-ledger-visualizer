import React, { useState, useEffect } from 'react'
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Shield,
  Database,
  Lock
} from 'lucide-react'

interface TransactionStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  timestamp?: string
  details: string
  ledgerAction: string
  atomicOperation: boolean
}

interface TransactionFlowProps {
  transactionId: string
  showAtomicDetails?: boolean
}

const mockTransactionFlow: TransactionStep[] = [
  {
    id: 'step_1',
    name: 'Transaction Validation',
    status: 'completed',
    timestamp: '2024-01-16T10:30:00.123Z',
    details: 'Validating transaction structure and required fields',
    ledgerAction: 'validate_transaction',
    atomicOperation: true
  },
  {
    id: 'step_2',
    name: 'Account Verification',
    status: 'completed',
    timestamp: '2024-01-16T10:30:00.156Z',
    details: 'Checking account existence and permissions',
    ledgerAction: 'verify_accounts',
    atomicOperation: true
  },
  {
    id: 'step_3',
    name: 'Balance Check',
    status: 'completed',
    timestamp: '2024-01-16T10:30:00.189Z',
    details: 'Verifying sufficient funds and credit limits',
    ledgerAction: 'check_balances',
    atomicOperation: true
  },
  {
    id: 'step_4',
    name: 'Atomic Posting',
    status: 'processing',
    timestamp: '2024-01-16T10:30:00.234Z',
    details: 'Executing atomic multi-posting transaction',
    ledgerAction: 'atomic_posting',
    atomicOperation: true
  },
  {
    id: 'step_5',
    name: 'Audit Trail Creation',
    status: 'pending',
    details: 'Creating immutable audit trail entry',
    ledgerAction: 'create_audit_trail',
    atomicOperation: true
  },
  {
    id: 'step_6',
    name: 'Real-time Analytics Update',
    status: 'pending',
    details: 'Updating analytics and triggering insights',
    ledgerAction: 'update_analytics',
    atomicOperation: false
  }
]

export function TransactionFlow({ transactionId, showAtomicDetails = true }: TransactionFlowProps) {
  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Simulate real-time transaction processing
    const interval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps]
        const nextStep = newSteps.findIndex(step => step.status === 'pending')
        
        if (nextStep !== -1) {
          newSteps[nextStep] = {
            ...newSteps[nextStep],
            status: 'processing',
            timestamp: new Date().toISOString()
          }
          
          // Complete the step after a short delay
          setTimeout(() => {
            setSteps(prevSteps => {
              const updatedSteps = [...prevSteps]
              updatedSteps[nextStep] = {
                ...updatedSteps[nextStep],
                status: 'completed',
                timestamp: new Date().toISOString()
              }
              return updatedSteps
            })
          }, 2000)
        }
        
        return newSteps
      })
    }, 3000)

    // Initialize with first step processing
    setSteps(mockTransactionFlow.map((step, index) => ({
      ...step,
      status: index === 0 ? 'processing' : 'pending'
    })))

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: TransactionStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: TransactionStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-blue-600" />
          Transaction Processing Flow
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Database className="h-4 w-4" />
          <span>ID: {transactionId}</span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border transition-all duration-300 ${getStatusColor(step.status)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {step.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {step.atomicOperation && (
                      <div className="flex items-center text-xs text-blue-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Atomic
                      </div>
                    )}
                    {step.timestamp && (
                      <span className="text-xs text-gray-500">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {step.details}
                </p>
                {showAtomicDetails && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">Ledger Action:</span>
                      <code className="bg-gray-100 px-1 rounded">{step.ledgerAction}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Behind the Scenes Benefits */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <Shield className="h-4 w-4 mr-2 text-blue-600" />
          What Formance Ledger Enables Behind the Scenes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Atomic Operations:</strong> All-or-nothing transaction integrity</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Real-time Analytics:</strong> Instant pattern detection and insights</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Audit Trail:</strong> Immutable transaction history</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Multi-Asset Support:</strong> Handle any currency or token</span>
          </div>
        </div>
      </div>
    </div>
  )
}
