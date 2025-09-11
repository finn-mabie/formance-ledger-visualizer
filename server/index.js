const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const fetch = require('node-fetch')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const LEDGER_BASE = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/ledger/v2'

// Default credentials (can be overridden by /api/credentials POST)
let defaultClientId = '38c6862b-327c-4c7c-b93c-00c0fac5a05f';
let defaultClientSecret = '6881226f-ad85-4206-aa67-ccdd1031dc2b';
let defaultTokenEndpoint = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/auth/oauth/token';

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
