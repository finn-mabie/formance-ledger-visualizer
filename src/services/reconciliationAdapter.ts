// Reconciliation API adapter
const base = '/api/reconciliation'

function emitApiCall(detail: any) {
  try {
    window.dispatchEvent(new CustomEvent('api-call', { detail }))
  } catch {}
}

export async function getReconciliationApi(url: string) {
  const endpoint = `${base}${url}`
  const start = performance.now()
  emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
  try {
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch reconciliation data')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function postReconciliationApi(url: string, body: any) {
  const endpoint = `${base}${url}`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: body, statusCode: 0 })
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: body, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error(data?.error || 'Failed to post reconciliation data')
    return data
  } catch (e) {
    emitApiCall({ method: 'POST', endpoint, status: 'error', request: body, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function deleteReconciliationApi(url: string) {
  const endpoint = `${base}${url}`
  const start = performance.now()
  emitApiCall({ method: 'DELETE', endpoint, status: 'pending', request: null, statusCode: 0 })
  try {
    const res = await fetch(endpoint, { method: 'DELETE' })
    emitApiCall({ method: 'DELETE', endpoint, status: res.ok ? 'success' : 'error', request: null, response: res.ok ? {} : await res.json().catch(() => ({})), statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || 'Failed to delete reconciliation data')
    }
    return {}
  } catch (e) {
    emitApiCall({ method: 'DELETE', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

// Policy management
export async function listPolicies(pageSize = 15, cursor?: string) {
  const params = new URLSearchParams()
  if (pageSize) params.set('pageSize', pageSize.toString())
  if (cursor) params.set('cursor', cursor)
  const query = params.toString() ? `?${params.toString()}` : ''
  return getReconciliationApi(`/policies${query}`)
}

export async function createPolicy(policy: {
  name: string
  ledgerName: string
  ledgerQuery: any
  paymentsPoolID: string
}) {
  return postReconciliationApi('/policies', policy)
}

export async function getPolicy(policyId: string) {
  return getReconciliationApi(`/policies/${encodeURIComponent(policyId)}`)
}

export async function deletePolicy(policyId: string) {
  return deleteReconciliationApi(`/policies/${encodeURIComponent(policyId)}`)
}

// Reconciliation management
export async function reconcileUsingPolicy(policyId: string, params: {
  reconciledAtLedger: string
  reconciledAtPayments: string
}) {
  return postReconciliationApi(`/policies/${encodeURIComponent(policyId)}/reconciliation`, params)
}

export async function listReconciliations(pageSize = 15, cursor?: string) {
  const urlParams = new URLSearchParams()
  if (pageSize) urlParams.set('pageSize', pageSize.toString())
  if (cursor) urlParams.set('cursor', cursor)
  const query = urlParams.toString() ? `?${urlParams.toString()}` : ''
  return getReconciliationApi(`/reconciliations${query}`)
}

export async function getReconciliation(reconciliationId: string) {
  return getReconciliationApi(`/reconciliations/${encodeURIComponent(reconciliationId)}`)
}

// Payment pools (for dropdown)
export async function getPaymentPools() {
  const endpoint = '/api/payments/v3/pools'
  const start = performance.now()
  emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
  try {
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error(data?.error || 'Failed to fetch payment pools')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

// Types
export interface ReconciliationPolicy {
  id: string
  name: string
  createdAt: string
  ledgerName: string
  ledgerQuery: any
  paymentsPoolID: string
}

export interface Reconciliation {
  id: string
  policyID: string
  createdAt: string
  reconciledAtLedger: string
  reconciledAtPayments: string
  status: 'COMPLETED' | 'FAILED' | 'PENDING'
  paymentsBalances: any
  ledgerBalances: any
  driftBalances: any
  error?: string
}

export interface PaymentPool {
  id: string
  name: string
  createdAt: string
  poolAccounts: string[]
}
