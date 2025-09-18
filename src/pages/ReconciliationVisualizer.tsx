import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Play, 
  RefreshCw, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { LiveAPIMonitor } from '../components/LiveAPIMonitor'
import { 
  listPolicies, 
  createPolicy, 
  deletePolicy, 
  reconcileUsingPolicy, 
  listReconciliations, 
  getReconciliation,
  getPaymentPools,
  type ReconciliationPolicy,
  type Reconciliation,
  type PaymentPool
} from '../services/reconciliationAdapter'

export default function ReconciliationVisualizer() {
  const [tab, setTab] = useState<'policies' | 'reconciliations'>('policies')
  const [policies, setPolicies] = useState<ReconciliationPolicy[]>([])
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [paymentPools, setPaymentPools] = useState<PaymentPool[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<ReconciliationPolicy | null>(null)
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null)
  const [loading, setLoading] = useState({ policies: false, reconciliations: false, create: false, reconcile: false, delete: false, pools: false })
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    ledgerName: 'default',
    ledgerQuery: '{"$match": {"metadata[reconciliation]": "treasury-pool"}}',
    paymentsPoolID: ''
  })

  const [reconcileParams, setReconcileParams] = useState({
    reconciledAtLedger: new Date().toISOString(),
    reconciledAtPayments: new Date().toISOString()
  })

  const loadPolicies = async () => {
    setLoading(prev => ({ ...prev, policies: true }))
    try {
      const res = await listPolicies(100)
      setPolicies(res.cursor?.data || [])
      setError(null)
    } catch (e) {
      setError(`Failed to load policies: ${e}`)
    } finally {
      setLoading(prev => ({ ...prev, policies: false }))
    }
  }

  const loadReconciliations = async () => {
    setLoading(prev => ({ ...prev, reconciliations: true }))
    try {
      const res = await listReconciliations(100)
      setReconciliations(res.cursor?.data || [])
      setError(null)
    } catch (e) {
      setError(`Failed to load reconciliations: ${e}`)
    } finally {
      setLoading(prev => ({ ...prev, reconciliations: false }))
    }
  }

  const loadPaymentPools = async () => {
    setLoading(prev => ({ ...prev, pools: true }))
    try {
      const res = await getPaymentPools()
      setPaymentPools(res.cursor?.data || [])
      setError(null)
    } catch (e) {
      setError(`Failed to load payment pools: ${e}`)
    } finally {
      setLoading(prev => ({ ...prev, pools: false }))
    }
  }

  const createNewPolicy = async () => {
    if (!newPolicy.name || !newPolicy.paymentsPoolID) {
      setError('Name and Payments Pool ID are required')
      return
    }

    setLoading(prev => ({ ...prev, create: true }))
    try {
      let ledgerQuery = {}
      try {
        ledgerQuery = JSON.parse(newPolicy.ledgerQuery)
      } catch {
        setError('Invalid JSON in ledger query')
        return
      }

      await createPolicy({
        name: newPolicy.name,
        ledgerName: newPolicy.ledgerName,
        ledgerQuery,
        paymentsPoolID: newPolicy.paymentsPoolID
      })

      setNewPolicy({ name: '', ledgerName: 'default', ledgerQuery: '{"$match": {"metadata[reconciliation]": "treasury-pool"}}', paymentsPoolID: '' })
      await loadPolicies()
      setError(null)
    } catch (e) {
      setError(`Failed to create policy: ${e}`)
    } finally {
      setLoading(prev => ({ ...prev, create: false }))
    }
  }

  const deletePolicyById = async (policyId: string) => {
    setLoading(prev => ({ ...prev, delete: true }))
    try {
      await deletePolicy(policyId)
      await loadPolicies()
      setError(null)
    } catch (e) {
      setError(`Failed to delete policy: ${e}`)
    } finally {
      setLoading(prev => ({ ...prev, delete: false }))
    }
  }

  const runReconciliation = async (policyId: string) => {
    setLoading(prev => ({ ...prev, reconcile: true }))
    try {
      await reconcileUsingPolicy(policyId, reconcileParams)
      await loadReconciliations()
      setError(null)
    } catch (e) {
      setError(`Failed to run reconciliation: ${e}`)
    } finally {
      setLoading(prev => ({ ...prev, reconcile: false }))
    }
  }

  const loadReconciliationDetails = async (reconciliationId: string) => {
    try {
      const reconciliation = await getReconciliation(reconciliationId)
      setSelectedReconciliation(reconciliation.data)
    } catch (e) {
      setError(`Failed to load reconciliation details: ${e}`)
    }
  }

  useEffect(() => {
    loadPaymentPools() // Load payment pools on component mount
  }, [])

  useEffect(() => {
    if (tab === 'policies') {
      loadPolicies()
    } else {
      loadReconciliations()
    }
  }, [tab])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reconciliation Visualizer</h1>
          <p className="text-slate-400">
            Manage reconciliation policies and monitor reconciliation processes between Formance Ledger and Payment Service Providers
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-300">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Panel - Policies */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Reconciliation Policies</h2>
              <button
                onClick={loadPolicies}
                disabled={loading.policies}
                className="btn-secondary inline-flex items-center gap-2 h-8 px-3"
              >
                <RefreshCw className={`h-4 w-4 ${loading.policies ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {/* Create Policy Form */}
              <div className="p-4 bg-slate-800/60 rounded border border-slate-700">
                <div className="text-sm text-slate-400 mb-3">Create New Policy</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input h-9"
                    placeholder="Policy name"
                    value={newPolicy.name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  />
                  <select
                    className="input h-9"
                    value={newPolicy.paymentsPoolID}
                    onChange={(e) => setNewPolicy({ ...newPolicy, paymentsPoolID: e.target.value })}
                    disabled={loading.pools}
                  >
                    <option value="">
                      {loading.pools ? 'Loading pools...' : 'Choose payment pool...'}
                    </option>
                    {paymentPools.map((pool) => (
                      <option key={pool.id} value={pool.id}>
                        {pool.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input h-9"
                    placeholder="Ledger name"
                    value={newPolicy.ledgerName}
                    onChange={(e) => setNewPolicy({ ...newPolicy, ledgerName: e.target.value })}
                  />
                  <textarea
                    className="input h-16 col-span-2"
                    placeholder="Ledger query (JSON)"
                    value={newPolicy.ledgerQuery}
                    onChange={(e) => setNewPolicy({ ...newPolicy, ledgerQuery: e.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <button
                    onClick={createNewPolicy}
                    disabled={loading.create}
                    className="btn-primary inline-flex items-center gap-2 h-8 px-3"
                  >
                    <Plus className="h-4 w-4" />
                    Create Policy
                  </button>
                </div>
              </div>

              {/* Policies List */}
              <div className="max-h-96 overflow-y-auto">
                {loading.policies ? (
                  <div className="text-center py-8 text-slate-400">Loading policies...</div>
                ) : policies.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No policies found</div>
                ) : (
                  <div className="space-y-2">
                    {policies.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 bg-slate-800/40 rounded border border-slate-700 hover:bg-slate-800/60 cursor-pointer"
                        onClick={() => setSelectedPolicy(policy)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{policy.name}</div>
                            <div className="text-xs text-slate-400">
                              Ledger: {policy.ledgerName} • Pool: {policy.paymentsPoolID.slice(0, 10)}...
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                runReconciliation(policy.id)
                              }}
                              disabled={loading.reconcile}
                              className="btn-secondary inline-flex items-center gap-1 h-7 px-2 text-xs"
                            >
                              <Play className="h-3 w-3" />
                              Reconcile
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deletePolicyById(policy.id)
                              }}
                              disabled={loading.delete}
                              className="btn-danger inline-flex items-center gap-1 h-7 px-2 text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Reconciliations */}
          <div className="bg-slate-900/60 rounded-lg border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Reconciliations</h2>
              <button
                onClick={loadReconciliations}
                disabled={loading.reconciliations}
                className="btn-secondary inline-flex items-center gap-2 h-8 px-3"
              >
                <RefreshCw className={`h-4 w-4 ${loading.reconciliations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading.reconciliations ? (
                <div className="text-center py-8 text-slate-400">Loading reconciliations...</div>
              ) : reconciliations.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No reconciliations found</div>
              ) : (
                <div className="space-y-2">
                  {reconciliations.map((reconciliation) => (
                    <div
                      key={reconciliation.id}
                      className="p-3 bg-slate-800/40 rounded border border-slate-700 hover:bg-slate-800/60 cursor-pointer"
                      onClick={() => loadReconciliationDetails(reconciliation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(reconciliation.status)}
                          <div>
                            <div className="font-medium text-sm">
                              {reconciliation.id.slice(0, 8)}...
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(reconciliation.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {reconciliation.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Policy Details */}
        {selectedPolicy && (
          <div className="mb-6 p-4 bg-slate-800/60 rounded border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Policy Details</h3>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-slate-400 hover:text-slate-300"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Name:</span> {selectedPolicy.name}
              </div>
              <div>
                <span className="text-slate-400">Ledger:</span> {selectedPolicy.ledgerName}
              </div>
              <div>
                <span className="text-slate-400">Payments Pool:</span> {selectedPolicy.paymentsPoolID}
              </div>
              <div>
                <span className="text-slate-400">Created:</span> {new Date(selectedPolicy.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-slate-400">Ledger Query:</span>
              <pre className="mt-1 p-2 bg-slate-900/60 rounded text-xs overflow-x-auto">
                {JSON.stringify(selectedPolicy.ledgerQuery, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Selected Reconciliation Details */}
        {selectedReconciliation && (
          <div className="mb-6 p-4 bg-slate-800/60 rounded border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Reconciliation Details</h3>
              <button
                onClick={() => setSelectedReconciliation(null)}
                className="text-slate-400 hover:text-slate-300"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-slate-400">ID:</span> {selectedReconciliation.id}
              </div>
              <div>
                <span className="text-slate-400">Status:</span> 
                <span className="ml-2 inline-flex items-center gap-1">
                  {getStatusIcon(selectedReconciliation.status)}
                  {selectedReconciliation.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Policy ID:</span> {selectedReconciliation.policyID}
              </div>
              <div>
                <span className="text-slate-400">Created:</span> {new Date(selectedReconciliation.createdAt).toLocaleString()}
              </div>
            </div>
            {selectedReconciliation.error && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-300">
                Error: {selectedReconciliation.error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 text-sm">Payments Balances:</span>
                <pre className="mt-1 p-2 bg-slate-900/60 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedReconciliation.paymentsBalances, null, 2)}
                </pre>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Ledger Balances:</span>
                <pre className="mt-1 p-2 bg-slate-900/60 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedReconciliation.ledgerBalances, null, 2)}
                </pre>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Drift Balances:</span>
                <pre className="mt-1 p-2 bg-slate-900/60 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedReconciliation.driftBalances, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Live API Monitor */}
        <LiveAPIMonitor 
          title="Reconciliation API Monitor"
          baseEndpoint="/api/reconciliation"
          filterPrefix="/api/reconciliation"
        />
      </div>
    </div>
  )
}
