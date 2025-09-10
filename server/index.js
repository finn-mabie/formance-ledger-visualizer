const express = require('express')
const crypto = require('crypto')
const cors = require('cors')
// Use Node's native fetch (Node 18+). No external fetch dependency needed.
const fetchFn = global.fetch.bind(global)

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(cors({ origin: true }))

// Simple in-memory encrypted store (replace with KMS/Secrets Manager in prod)
const ENC_KEY = crypto.randomBytes(32)
const IV = crypto.randomBytes(16)
let encryptedCreds = null

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, IV)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([enc, tag]).toString('base64')
}

function decrypt(b64) {
  const buf = Buffer.from(b64, 'base64')
  const tag = buf.slice(buf.length - 16)
  const data = buf.slice(0, buf.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, IV)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}

const LEDGER_BASE = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/ledger/v2'
const TOKEN_URL = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/auth/oauth/token'

// Defaults from env or provided values (override via /api/credentials if needed)
const DEFAULT_CLIENT_ID = process.env.FORMANCE_CLIENT_ID || '38c6862b-327c-4c7c-b93c-00c0fac5a05f'
const DEFAULT_CLIENT_SECRET = process.env.FORMANCE_CLIENT_SECRET || '6881226f-ad85-4206-aa67-ccdd1031dc2b'

let cachedToken = null
async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.access_token
  }
  if (!encryptedCreds) throw new Error('Credentials not set')
  const creds = JSON.parse(decrypt(encryptedCreds))
  console.log('Using credentials for client:', creds.clientId)
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
  })
  const res = await fetchFn(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) {
    const text = await res.text()
    console.error('Token response error:', res.status, text)
    throw new Error(`Token error: ${res.status}`)
  }
  const json = await res.json()
  cachedToken = { ...json, expiresAt: Date.now() + json.expires_in * 1000 }
  console.log('Got new access token')
  return cachedToken.access_token
}

app.post('/api/credentials', (req, res) => {
  const { clientId, clientSecret } = req.body || {}
  if (!clientId || !clientSecret) return res.status(400).json({ error: 'Missing credentials' })
  encryptedCreds = encrypt(JSON.stringify({ clientId, clientSecret }))
  cachedToken = null
  res.json({ ok: true })
})

// Initialize credentials once on boot if not already set
if (!encryptedCreds && DEFAULT_CLIENT_ID && DEFAULT_CLIENT_SECRET) {
  try {
    encryptedCreds = encrypt(JSON.stringify({ clientId: DEFAULT_CLIENT_ID, clientSecret: DEFAULT_CLIENT_SECRET }))
    console.log('Initialized with default credentials')
  } catch (e) {
    console.error('Failed to initialize credentials:', e.message)
  }
}

app.post('/api/test-connection', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = req.body?.ledger || 'cursor-test'
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(ledger)}`, { headers: { Authorization: `Bearer ${token}` } })
    const j = await r.json().catch(() => ({}))
    res.json({ ok: r.ok, status: r.status, body: j })
  } catch (e) {
    console.error('Test connection error:', e.message || e)
    res.status(500).json({ ok: false, error: 'Connection failed', details: e.message })
  }
})

// Proxy minimal adapter endpoints
app.get('/api/ledger/:ledger/accounts', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const hasBody = req.body && Object.keys(req.body || {}).length > 0
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/accounts${qs}`, {
      method: 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${token}` },
      body: hasBody ? JSON.stringify(req.body) : undefined
    })
    const j = await r.json()
    res.json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list accounts' })
  }
})

// POST body filter for accounts listing (no /search suffix)
app.post('/api/ledger/:ledger/accounts', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list accounts (POST)' })
  }
})

app.get('/api/ledger/:ledger/transactions', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const hasBody = req.body && Object.keys(req.body || {}).length > 0
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/transactions${qs}`, {
      method: 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${token}` },
      body: hasBody ? JSON.stringify(req.body) : undefined
    })
    const j = await r.json()
    res.json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions' })
  }
})

// POST body filter for transactions listing (no /search suffix)
app.post('/api/ledger/:ledger/transactions', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    console.error('Transaction error:', e.message || e)
    res.status(500).json({ error: 'Failed to POST /transactions', details: e.message })
  }
})

// Add metadata to an account
app.post('/api/ledger/:ledger/accounts/:address/metadata', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const address = encodeURIComponent(req.params.address)
    const r = await fetchFn(`${LEDGER_BASE}/${ledger}/accounts/${address}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    if (r.status === 204) {
      res.status(204).send()
    } else {
      const j = await r.json().catch(() => ({}))
      res.status(r.status).json(j)
    }
  } catch (e) {
    console.error('Metadata error:', e.message || e)
    res.status(500).json({ error: 'Failed to update metadata', details: e.message })
  }
})

// Set metadata on a transaction by its ID
app.post('/api/ledger/:ledger/transactions/:id/metadata', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const id = encodeURIComponent(req.params.id)
    const r = await fetchFn(`${LEDGER_BASE}/${ledger}/transactions/${id}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    if (r.status === 204) {
      res.status(204).send()
    } else {
      const j = await r.json().catch(() => ({}))
      res.status(r.status).json(j)
    }
  } catch (e) {
    console.error('Transaction metadata error:', e.message || e)
    res.status(500).json({ error: 'Failed to update transaction metadata', details: e.message })
  }
})

// Aggregate accounts + balances for quick UI listing
app.get('/api/ledger/:ledger/account-balances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const hasBody = req.body && Object.keys(req.body || {}).length > 0
    const r = await fetchFn(`${LEDGER_BASE}/${ledger}/aggregate/balances${qs}`, {
      method: 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${token}` },
      body: hasBody ? JSON.stringify(req.body) : undefined
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to load account balances', details: e.message })
  }
})

// Volumes passthrough with optional filters
app.get('/api/ledger/:ledger/volumes', async (req, res) => {
  try {
    const token = await getAccessToken()
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    const hasBody = req.body && Object.keys(req.body || {}).length > 0
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/volumes${qs}`, {
      method: 'GET',
      headers: hasBody ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${token}` },
      body: hasBody ? JSON.stringify(req.body) : undefined
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list volumes' })
  }
})

// POST body filter for volumes (no /search suffix)
app.post('/api/ledger/:ledger/volumes', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/volumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list volumes (POST)' })
  }
})

// POST body filter for aggregate balances (no /search suffix)
app.post('/api/ledger/:ledger/account-balances', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const body = JSON.stringify(req.body || {})
    // Accounts with body filter
    const accRes = await fetchFn(`${LEDGER_BASE}/${ledger}/accounts?pageSize=100`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body
    })
    if (!accRes.ok) {
      const txt = await accRes.text()
      return res.status(accRes.status).json({ error: 'Accounts failed', details: txt })
    }
    const accountsResponse = await accRes.json().catch(() => ({}))
    const accounts = accountsResponse?.cursor?.data || accountsResponse?.data || []

    // Volumes with body filter
    const volRes = await fetchFn(`${LEDGER_BASE}/${ledger}/volumes?pageSize=100`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body
    })
    const volumesJson = await volRes.json().catch(() => ({}))
    const volumeData = volumesJson?.cursor?.data || volumesJson?.data || []

    const balanceMap = new Map()
    for (const vol of volumeData) {
      if (!balanceMap.has(vol.account)) balanceMap.set(vol.account, {})
      balanceMap.get(vol.account)[vol.asset] = vol.balance
    }
    const result = []
    const seen = new Set()
    for (const a of accounts) {
      seen.add(a.address)
      result.push({ account: a.address, balances: balanceMap.get(a.address) || {}, metadata: a.metadata || {} })
    }
    for (const [addr, balances] of balanceMap) {
      if (!seen.has(addr)) result.push({ account: addr, balances, metadata: {} })
    }
    res.json({ data: result })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load account balances (POST)', details: e.message })
  }
})

app.post('/api/ledger/:ledger/transactions/filter', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/transactions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions (filter)', details: e.message })
  }
})

app.post('/api/ledger/:ledger/accounts/filter', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/accounts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list accounts (filter)', details: e.message })
  }
})

app.post('/api/ledger/:ledger/volumes/filter', async (req, res) => {
  try {
    const token = await getAccessToken()
    const r = await fetchFn(`${LEDGER_BASE}/${encodeURIComponent(req.params.ledger)}/volumes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(req.body || {})
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list volumes (filter)', details: e.message })
  }
})

app.post('/api/ledger/:ledger/account-balances/filter', async (req, res) => {
  try {
    const token = await getAccessToken()
    const ledger = encodeURIComponent(req.params.ledger)
    const body = JSON.stringify(req.body || {})
    const r = await fetchFn(`${LEDGER_BASE}/${ledger}/aggregate/balances`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body
    })
    const j = await r.json().catch(() => ({}))
    res.status(r.status).json(j)
  } catch (e) {
    res.status(500).json({ error: 'Failed to load account balances (filter)', details: e.message })
  }
})

const PORT = process.env.PORT || 8787
app.listen(PORT, () => {
  // Do not log secrets
  console.log(`API server running on http://localhost:${PORT}`)
})


