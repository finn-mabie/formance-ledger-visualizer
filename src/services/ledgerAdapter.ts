function emitApiCall(detail: any) {
  try {
    window.dispatchEvent(new CustomEvent('api-call', { detail }))
  } catch {}
}

export async function listAccounts(ledger: string) {
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/accounts`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list accounts')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listAccountsWithBalances(ledger: string) {
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/accounts?expand=volumes`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to fetch accounts with balances')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listTransactions(ledger: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/transactions${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list transactions')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listVolumes(ledger: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/volumes${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list volumes')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listAccountsFiltered(ledger: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/accounts${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list accounts')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listAccountBalancesFiltered(ledger: string, params: Record<string, string> = {}) {
  const q = new URLSearchParams(params).toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/account-balances${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to fetch account balances')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

// Filter variants using query parameter
export async function searchTransactions(ledger: string, filter: any) {
  const params = new URLSearchParams()
  if (filter && Object.keys(filter || {}).length > 0) {
    params.set('query', JSON.stringify(filter))
  }
  const q = params.toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/transactions${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: filter, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: filter, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list transactions')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: filter, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function searchAccounts(ledger: string, filter: any, expandVolumes: boolean = true) {
  const params = new URLSearchParams()
  if (filter && Object.keys(filter || {}).length > 0) {
    params.set('query', JSON.stringify(filter))
  }
  if (expandVolumes) {
    params.set('expand', 'volumes')
  }
  const q = params.toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/accounts${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: filter, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: filter, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list accounts')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: filter, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function searchVolumes(ledger: string, filter: any) {
  const params = new URLSearchParams()
  if (filter && Object.keys(filter || {}).length > 0) {
    params.set('query', JSON.stringify(filter))
  }
  const q = params.toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/volumes${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: filter, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: filter, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list volumes')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: filter, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function searchBalances(ledger: string, filter: any) {
  const params = new URLSearchParams()
  if (filter && Object.keys(filter || {}).length > 0) {
    params.set('query', JSON.stringify(filter))
  }
  const q = params.toString()
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/account-balances${q ? `?${q}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: filter, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: filter, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to fetch account balances')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: filter, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function createTransaction(ledger: string, payload: any) {
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/transactions`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: payload, statusCode: 0 })
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const body = await res.json().catch(() => ({}))
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: payload, response: body, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok) {
    console.error('Transaction creation failed:', body)
    throw new Error(body.errorMessage || body.error || 'Failed to create transaction')
  }
  return body
}

export async function listAccountBalances(ledger: string) {
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/account-balances`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to fetch account balances')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function updateAccountMetadata(ledger: string, address: string, metadata: Record<string, any>) {
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/accounts/${encodeURIComponent(address)}/metadata`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: metadata, statusCode: 0 })
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  })
  let body: any = null
  try { body = await res.json() } catch {}
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: metadata, response: body || {}, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok && res.status !== 204) {
    const error = body || { error: 'Unknown error' }
    throw new Error(error.error || error.errorMessage || 'Failed to update metadata')
  }
  return res.status === 204 ? {} : body
}

export async function updateTransactionMetadata(ledger: string, id: number | string, metadata: Record<string, any>) {
  const endpoint = `/api/ledger/${encodeURIComponent(ledger)}/transactions/${encodeURIComponent(String(id))}/metadata`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: metadata, statusCode: 0 })
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata)
  })
  let body: any = null
  try { body = await res.json() } catch {}
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: metadata, response: body || {}, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok && res.status !== 204) {
    const error = body || { error: 'Unknown error' }
    throw new Error(error.error || error.errorMessage || 'Failed to update transaction metadata')
  }
  return res.status === 204 ? {} : body
}


