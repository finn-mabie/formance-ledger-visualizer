const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const fetch = require('node-fetch')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

const LEDGER_BASE = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/ledger/v2'
const PAYMENTS_BASE = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/payments/v3'

// Stripe configuration (server-side only)
const STRIPE_BASE = 'https://api.stripe.com/v1'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51Rr1W62Loqoft2LQT3YJfbXd9BqZ2h3qF4Kdq806bSR6tWbtRz9GSBmPjmRvuQyCUJs1tlZOk8Ox47B4gne8UB5U00btmoMnde'

function toForm(params) {
  const search = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (typeof v === 'object' && !Array.isArray(v)) {
      Object.entries(v).forEach(([k2, v2]) => {
        if (typeof v2 === 'object' && !Array.isArray(v2)) {
          Object.entries(v2).forEach(([k3, v3]) => search.append(`${k}[${k2}][${k3}]`, String(v3)))
        } else {
          search.append(`${k}[${k2}]`, String(v2))
        }
      })
    } else if (Array.isArray(v)) {
      v.forEach((val, i) => search.append(`${k}[${i}]`, String(val)))
    } else {
      search.append(k, String(v))
    }
  })
  return search.toString()
}

async function stripeRequest(path, { method = 'GET', body = null } = {}) {
  const headers = { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` }
  let url = `${STRIPE_BASE}${path}`
  let fetchOpts = { method, headers }
  if (method !== 'GET' && body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    fetchOpts.body = toForm(body)
  }
  const r = await fetch(url, fetchOpts)
  const text = await r.text()
  let json = {}
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  if (!r.ok) {
    const msg = json.error?.message || text || 'Stripe error'
    throw new Error(msg)
  }
  return json
}

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

// Stripe endpoints
app.get('/api/stripe/config', async (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51Rr1W62Loqoft2LQ1o12A1gU2z3QXmmEatK3VqAJdKzfvKjfMQP88vTwMCEOH4lM1U20LdUxOK6jWrvZnUWaKXzp00hTsMGux7' })
})

// Create connected account (Custom by default)
app.post('/api/stripe/accounts', async (req, res) => {
  try {
    const { type = 'custom', country = 'US', email, business_type = 'individual', capabilities = { card_payments: { requested: true }, transfers: { requested: true } } } = req.body || {}
    const account = await stripeRequest('/accounts', { method: 'POST', body: { type, country, email, business_type, capabilities } })
    res.json(account)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

// Create account link for Express onboarding
app.post('/api/stripe/account_links', async (req, res) => {
  try {
    const { account, refresh_url, return_url, type = 'account_onboarding' } = req.body || {}
    const link = await stripeRequest('/account_links', { method: 'POST', body: { account, refresh_url, return_url, type } })
    res.json(link)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

// List connected accounts (simple list)
app.get('/api/stripe/accounts', async (req, res) => {
  try {
    const list = await stripeRequest('/accounts')
    res.json(list)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

// Create destination charge PaymentIntent
app.post('/api/stripe/payment_intents', async (req, res) => {
  try {
    const { amount, currency, destination, application_fee_amount, description } = req.body || {}
    const body = {
      amount,
      currency,
      description,
      'automatic_payment_methods[enabled]': 'true',
      'transfer_data[destination]': destination,
      payment_method: 'pm_card_visa',
      confirm: 'true'
    }
    if (application_fee_amount) body['application_fee_amount'] = application_fee_amount
    const pi = await stripeRequest('/payment_intents', { method: 'POST', body })
    res.json(pi)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
  }
})

// Refund
app.post('/api/stripe/refunds', async (req, res) => {
  try {
    const { payment_intent, amount } = req.body || {}
    const refund = await stripeRequest('/refunds', { method: 'POST', body: { payment_intent, amount } })
    res.json(refund)
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) })
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
