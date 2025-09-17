function emitApiCall(detail: any) {
  try {
    window.dispatchEvent(new CustomEvent('api-call', { detail }))
  } catch {}
}

export async function getPaymentsApi(url: string) {
  const endpoint = url
  const start = performance.now()
  try {
    emitApiCall({ method: 'GET', endpoint, status: 'pending', request: null, statusCode: 0 })
    const res = await fetch(url)
    const data = await res.json()
    emitApiCall({ method: 'GET', endpoint, status: res.ok ? 'success' : 'error', request: null, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Request failed')
    return data
  } catch (e) {
    emitApiCall({ method: 'GET', endpoint, status: 'error', request: null, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}

export async function postPaymentsApi(url: string, body: any) {
  const endpoint = url
  const start = performance.now()
  try {
    emitApiCall({ method: 'POST', endpoint, status: 'pending', request: body, statusCode: 0 })
    const res = await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    })
    const data = await res.json()
    emitApiCall({ method: 'POST', endpoint, status: res.ok ? 'success' : 'error', request: body, response: data, statusCode: res.status, duration: performance.now() - start })
    if (!res.ok) throw new Error('Request failed')
    return data
  } catch (e) {
    emitApiCall({ method: 'POST', endpoint, status: 'error', request: body, response: { error: String(e) }, statusCode: 0, duration: performance.now() - start })
    throw e
  }
}
