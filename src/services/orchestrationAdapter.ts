function emitApiCall(detail: any) {
  try {
    window.dispatchEvent(new CustomEvent('api-call', { detail }))
  } catch {}
}

const base = '/api/orchestration/v2'

export async function listWorkflows(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => q.set(k, String(v)))
  const endpoint = `${base}/workflows${q.toString() ? `?${q.toString()}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list workflows')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function createWorkflow(config: { name: string; stages: any[] }) {
  const endpoint = `${base}/workflows`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: { config }, statusCode: 0 })
  // Orchestration v2 expects the config directly for flows creation
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) })
  const body = await res.json().catch(() => ({}))
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: { config }, response: body, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok) throw new Error(body?.error || 'Failed to create workflow')
  return body
}

export async function getWorkflow(id: string) {
  const endpoint = `${base}/workflows/${encodeURIComponent(id)}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to get workflow')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function deleteWorkflow(id: string) {
  const endpoint = `${base}/workflows/${encodeURIComponent(id)}`
  const start = performance.now()
  const res = await fetch(endpoint, { method: 'DELETE' })
  let body: any = {}
  try { body = await res.json() } catch {}
  emitApiCall({ method: 'DELETE', endpoint, status: res.ok ? 'success' : 'error', request: null, response: body, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok && res.status !== 204) throw new Error(body?.error || 'Failed to delete workflow')
  return {}
}

export async function runWorkflow(id: string, input: Record<string, any> = {}) {
  const endpoint = `${base}/workflows/${encodeURIComponent(id)}/instances`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: { vars: input }, statusCode: 0 })
  // Per docs, body is arbitrary object: keys are variable names and string values
  const bodyPayload = input || {}
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyPayload) })
  const body = await res.json().catch(() => ({}))
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: { vars: input }, response: body, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok) throw new Error(body?.errorMessage || body?.error || 'Failed to run workflow')
  return body
}

export async function listWorkflowInstances(workflowId?: string, params: Record<string, string | number> = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => q.set(k, String(v)))
  if (workflowId) {
    q.set('workflowID', workflowId) // Use workflowID query param for /instances endpoint
  }
  const endpoint = `${base}/instances${q.toString() ? `?${q.toString()}` : ''}` // Use /instances endpoint
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list workflow instances')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listInstances(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => q.set(k, String(v)))
  const endpoint = `${base}/instances${q.toString() ? `?${q.toString()}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list instances')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function getWorkflowInstance(id: string, instanceId: string) {
  const endpoint = `${base}/workflows/${encodeURIComponent(id)}/instances/${encodeURIComponent(instanceId)}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to get workflow instance')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function listTriggers(params: Record<string, string | number> = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => q.set(k, String(v)))
  const endpoint = `${base}/triggers${q.toString() ? `?${q.toString()}` : ''}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to list triggers')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function createTrigger(payload: { event: string; workflowID: string; filter?: string; vars?: any; name?: string }) {
  const endpoint = `${base}/triggers`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: payload, statusCode: 0 })
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const body = await res.json().catch(() => ({}))
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: payload, response: body, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok) throw new Error(body?.error || 'Failed to create trigger')
  return body
}

export async function readTrigger(triggerID: string) {
  const endpoint = `${base}/triggers/${encodeURIComponent(triggerID)}`
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(endpoint)
    const data = await res.json().catch(() => ({}))
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Failed to read trigger')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function testTrigger(triggerID: string, body: Record<string, any> = {}) {
  const endpoint = `${base}/triggers/${encodeURIComponent(triggerID)}/test`
  const start = performance.now()
  emitApiCall({ method: 'POST', endpoint, status: 'pending', request: body, statusCode: 0 })
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: body, response: data, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok) throw new Error('Failed to test trigger')
  return data
}

export async function deleteTrigger(triggerID: string) {
  const endpoint = `${base}/triggers/${encodeURIComponent(triggerID)}`
  const start = performance.now()
  const res = await fetch(endpoint, { method: 'DELETE' })
  let body: any = {}
  try { body = await res.json() } catch {}
  emitApiCall({ method: 'DELETE', endpoint, status: res.ok ? 'success' : 'error', request: null, response: body, statusCode: res.status, duration: performance.now() - start })
  if (!res.ok && res.status !== 204) throw new Error(body?.error || 'Failed to delete trigger')
  return {}
}


