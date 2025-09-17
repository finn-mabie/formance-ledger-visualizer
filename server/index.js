const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const fetch = require('node-fetch')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const FOR_BASE = process.env.FORMANCE_BASE_URL || 'https://htelokuekgot-tfyo.us-east-1.formance.cloud'
const LEDGER_BASE = `${FOR_BASE}/api/ledger/v2`
const PAYMENTS_BASE = `${FOR_BASE}/api/payments/v3`
const ORCHESTRATION_BASE = `${FOR_BASE}/api/orchestration/v2`

// Default credentials (can be overridden by /api/credentials POST)
let defaultClientId = process.env.FORMANCE_CLIENT_ID || '38c6862b-327c-4c7c-b93c-00c0fac5a05f';
let defaultClientSecret = process.env.FORMANCE_CLIENT_SECRET || '6881226f-ad85-4206-aa67-ccdd1031dc2b';
let defaultTokenEndpoint = process.env.FORMANCE_TOKEN_ENDPOINT || `${FOR_BASE}/api/auth/oauth/token`;

// Initialize encryptedCreds with default credentials
let encryptedCreds = null;

const algorithm = 'aes-256-gcm'
const keyLength = 32
const ivLength = 16
const tagLength = 16
const saltLength = 64

function encrypt(text) {
  const salt = crypto.randomBytes(saltLength)
  const key = crypto.pbkdf2Sync('secure-app-key', salt, 10000, keyLength, 'sha256')
  const iv = crypto.randomBytes(ivLength)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
}

function decrypt(data) {
  const bData = Buffer.from(data, 'base64')
  const salt = bData.subarray(0, saltLength)
  const iv = bData.subarray(saltLength, saltLength + ivLength)
  const tag = bData.subarray(saltLength + ivLength, saltLength + ivLength + tagLength)
  const encrypted = bData.subarray(saltLength + ivLength + tagLength)
  const key = crypto.pbkdf2Sync('secure-app-key', salt, 10000, keyLength, 'sha256')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted, null, 'utf8') + decipher.final('utf8')
}

// Initialize with default credentials
encryptedCreds = encrypt(JSON.stringify({ clientId: defaultClientId, clientSecret: defaultClientSecret }));

let accessToken = null
let tokenExpiry = null

async function getAccessToken() {
  if (process.env.FORMANCE_API_TOKEN) {
    return process.env.FORMANCE_API_TOKEN
  }
  if (accessToken && tokenExpiry && new Date() < tokenExpiry) {
    return accessToken
  }
  const creds = encryptedCreds ? JSON.parse(decrypt(encryptedCreds)) : { clientId: defaultClientId, clientSecret: defaultClientSecret }
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.clientId,
    client_secret: creds.clientSecret
  })
  const r = await fetch(defaultTokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  if (!r.ok) {
    const errorText = await r.text()
    console.error('OAuth error:', errorText)
    throw new Error('Failed to get access token')
  }
  const data = await r.json()
  accessToken = data.access_token
  tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000)
  return accessToken
}

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    await getAccessToken()
    res.json({ ok: true })
  } catch (e) {
    console.error('Test connection error:', e.message || e)
    res.status(500).json({ ok: false, error: 'Connection failed', details: e.message })
  }
})

// Payments v3 proxy endpoints (simulate PSP using Formance Payments)
app.get('/api/payments/v3/accounts', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${PAYMENTS_BASE}/accounts${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list payments accounts' })
  }
})

app.post('/api/payments/v3/accounts', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${PAYMENTS_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create payments account' })
  }
})

app.get('/api/payments/v3/payments', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${PAYMENTS_BASE}/payments${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list payments' })
  }
})

app.post('/api/payments/v3/payments', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${PAYMENTS_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

app.post('/api/payments/v3/payment-initiations', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${PAYMENTS_BASE}/payment-initiations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to initiate payment' })
  }
})

app.post('/api/payments/v3/payment-initiations/:id/approve', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.id)
    const r = await fetch(`${PAYMENTS_BASE}/payment-initiations/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve payment initiation' })
  }
})

app.get('/api/payments/v3/connectors', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${PAYMENTS_BASE}/connectors`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list connectors' })
  }
})

app.get('/api/payments/v3/connectors/configurations', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${PAYMENTS_BASE}/connectors/configurations`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list connector configurations' })
  }
})

// Payments v3 additional proxies
app.get('/api/payments/v3/payments/:id', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = req.params.id
    const r = await fetch(`${PAYMENTS_BASE}/payments/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get payment' })
  }
})

app.get('/api/payments/v3/payouts', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${PAYMENTS_BASE}/payouts${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list payouts' })
  }
})

app.get('/api/payments/v3/accounts/:id', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = req.params.id
    const r = await fetch(`${PAYMENTS_BASE}/accounts/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get account' })
  }
})

// Payments v3: account balances
app.get('/api/payments/v3/accounts/:id/balances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = req.params.id // Don't encode again - Express already decodes it
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${PAYMENTS_BASE}/accounts/${encodeURIComponent(id)}/balances${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get account balances' })
  }
})

// Orchestration v2 proxy endpoints
app.get('/api/orchestration/v2/workflows', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    let r = await fetch(`${ORCHESTRATION_BASE}/workflows${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.status === 404) {
      r = await fetch(`${ORCHESTRATION_BASE}/flows${qs}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    }
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list workflows' })
  }
})

app.post('/api/orchestration/v2/workflows', async (req, res) => {
  try {
    const token = await getAccessToken()
    // Forward either JSON or raw YAML/text based on incoming content-type
    const incomingType = (req.headers['content-type'] || '').toLowerCase()
    const isJson = incomingType.includes('application/json')
    const upstreamHeaders = { Authorization: `Bearer ${token}` }
    let body
    if (isJson) {
      upstreamHeaders['Content-Type'] = 'application/json'
      body = JSON.stringify(req.body || {})
    } else {
      upstreamHeaders['Content-Type'] = incomingType || 'text/plain'
      // Need raw text body; express.json won't give it. Re-serialize best-effort.
      body = typeof req.body === 'string' ? req.body : (req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : '')
      // If body became '[object Object]', clear it to avoid corruption.
      if (body === '[object Object]') body = ''
    }
    let r = await fetch(`${ORCHESTRATION_BASE}/workflows`, {
      method: 'POST',
      headers: upstreamHeaders,
      body
    })
    if (r.status === 404) {
      r = await fetch(`${ORCHESTRATION_BASE}/flows`, { method: 'POST', headers: upstreamHeaders, body })
    }
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create workflow' })
  }
})

app.get('/api/orchestration/v2/workflows/:id', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.id)
    let r = await fetch(`${ORCHESTRATION_BASE}/workflows/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.status === 404) {
      r = await fetch(`${ORCHESTRATION_BASE}/flows/${id}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    }
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get workflow' })
  }
})

app.delete('/api/orchestration/v2/workflows/:id', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.id)
    let r = await fetch(`${ORCHESTRATION_BASE}/workflows/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.status === 404) {
      r = await fetch(`${ORCHESTRATION_BASE}/flows/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    }
    if (r.status === 204) return res.status(204).send()
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete workflow' })
  }
})

// Run a workflow (create instance)
app.post('/api/orchestration/v2/workflows/:id/instances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.id)
    const upstreamHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const provided = req.body || {}
    const vars = provided.vars || provided.input || provided

    // Try common shapes in order
    const attemptBodies = [
      JSON.stringify(vars),
      JSON.stringify({ vars }),
      JSON.stringify({ input: vars })
    ]
    let r = null
    for (const body of attemptBodies) {
      r = await fetch(`${ORCHESTRATION_BASE}/workflows/${id}/instances`, {
        method: 'POST', headers: upstreamHeaders, body
      })
      if (r.status !== 404 && r.status !== 400) break
      if (r.status === 404) {
        const r2 = await fetch(`${ORCHESTRATION_BASE}/flows/${id}/instances`, { method: 'POST', headers: upstreamHeaders, body })
        if (r2.status !== 400 && r2.status !== 404) { r = r2; break }
      }
    }
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to run workflow' })
  }
})

app.get('/api/orchestration/v2/workflows/:id/instances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.id)
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    let r = await fetch(`${ORCHESTRATION_BASE}/workflows/${id}/instances${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.status === 404) {
      r = await fetch(`${ORCHESTRATION_BASE}/flows/${id}/instances${qs}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    }
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list workflow instances' })
  }
})

app.get('/api/orchestration/v2/workflows/:id/instances/:instanceId', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.id)
    const instanceId = encodeURIComponent(req.params.instanceId)
    let r = await fetch(`${ORCHESTRATION_BASE}/workflows/${id}/instances/${instanceId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.status === 404) {
      r = await fetch(`${ORCHESTRATION_BASE}/flows/${id}/instances/${instanceId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
    }
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get workflow instance' })
  }
})

// Triggers
app.get('/api/orchestration/v2/triggers', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${ORCHESTRATION_BASE}/triggers${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list triggers' })
  }
})

app.post('/api/orchestration/v2/triggers', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${ORCHESTRATION_BASE}/triggers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create trigger' })
  }
})

app.get('/api/orchestration/v2/triggers/:triggerID', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.triggerID)
    const r = await fetch(`${ORCHESTRATION_BASE}/triggers/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to read trigger' })
  }
})

app.delete('/api/orchestration/v2/triggers/:triggerID', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.triggerID)
    const r = await fetch(`${ORCHESTRATION_BASE}/triggers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (r.status === 204) return res.status(204).send()
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete trigger' })
  }
})

app.post('/api/orchestration/v2/triggers/:triggerID/test', async (req, res) => {
  try {
    const token = await getAccessToken()
    const id = encodeURIComponent(req.params.triggerID)
    const r = await fetch(`${ORCHESTRATION_BASE}/triggers/${id}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to test trigger' })
  }
})

// Orchestration: list all instances
app.get('/api/orchestration/v2/instances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    let r = await fetch(`${ORCHESTRATION_BASE}/instances${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    // no alternative path known; return result
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list instances' })
  }
})

// Proxy endpoints for listing resources with query parameter support
app.get('/api/ledger/:ledger/accounts', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/accounts${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json()
    res.json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list accounts' })
  }
})

app.get('/api/ledger/:ledger/accounts/:address', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const address = encodeURIComponent(req.params.address)
    const r = await fetch(`${LEDGER_BASE}/${ledger}/accounts/${address}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get ledger account' })
  }
})

app.get('/api/ledger/:ledger/transactions', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/transactions${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json()
    res.json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions' })
  }
})

app.get('/api/ledger/:ledger/volumes', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/volumes${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list volumes' })
  }
})

app.get('/api/ledger/:ledger/account-balances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const r = await fetch(`${LEDGER_BASE}/${ledger}/aggregate/balances${qs}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to load account balances', details: e.message })
  }
})

// POST endpoint for creating transactions
app.post('/api/ledger/:ledger/transactions', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetch(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body)
    })
    const data = await r.json().catch(() => ({}))
    res.status(r.status).json(data)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create transaction', details: e.message })
  }
})

// Add metadata to an account
app.post('/api/ledger/:ledger/accounts/:address/metadata', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const address = encodeURIComponent(req.params.address)
    const r = await fetch(`${LEDGER_BASE}/${ledger}/accounts/${address}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body)
    })
    if (r.status === 204) {
      res.status(204).send()
    } else {
      const j = await r.json().catch(() => ({}))
      res.status(r.status).json(j)
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update account metadata' })
  }
})

// Set metadata on a transaction by its ID
app.post('/api/ledger/:ledger/transactions/:id/metadata', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const id = encodeURIComponent(req.params.id)
    const r = await fetch(`${LEDGER_BASE}/${ledger}/transactions/${id}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body)
    })
    if (r.status === 204) {
      res.status(204).send()
    } else {
      const j = await r.json().catch(() => ({}))
      res.status(r.status).json(j)
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update transaction metadata' })
  }
})

const PORT = process.env.PORT || 8787
const server = app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

// Prevent the process from exiting
process.stdin.resume()
