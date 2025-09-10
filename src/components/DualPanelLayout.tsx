import React, { ReactNode } from 'react'
import { BackendLedgerView } from './BackendLedgerView'
import { Eye, Database, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface DualPanelLayoutProps {
  children: ReactNode
  useCase: string
  title: string
  description: string
  transactionId?: string
  showBackendView?: boolean
}

export function DualPanelLayout({ 
  children, 
  useCase, 
  title, 
  description, 
  transactionId,
  showBackendView = true 
}: DualPanelLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-lg text-gray-600">{description}</p>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Eye className="h-4 w-4" />
            <span>Frontend User Experience</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Database className="h-4 w-4" />
            <span>Backend Ledger Perspective</span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          See how Formance Ledger powers this experience behind the scenes
        </div>
      </div>

      {/* Dual Panel Layout - Top/Bottom */}
      <div className="space-y-6">
        {/* Frontend Panel */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-600" />
              Frontend Experience
            </h3>
            <p className="text-sm text-gray-600 mt-1">What users see and interact with</p>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Backend Panel */}
        {showBackendView && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <BackendLedgerView 
              useCase={useCase} 
              transactionId={transactionId}
              showLiveAPI={true}
            />
          </div>
        )}
      </div>

      {/* Integration Benefits */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          How Formance Ledger Powers This Experience
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Atomic Transactions</h4>
            <p className="text-sm text-gray-600">
              Every user action triggers reliable, auditable ledger operations
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Real-time Updates</h4>
            <p className="text-sm text-gray-600">
              Instant data synchronization between frontend and backend
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Data Integrity</h4>
            <p className="text-sm text-gray-600">
              Guaranteed consistency and audit trails for all operations
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
