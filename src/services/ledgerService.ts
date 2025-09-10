import { Account, Transaction, Balance, LedgerStats } from '@/types/ledger'

interface OAuthToken {
  access_token: string
  token_type: string
  expires_in: number
  expires_at?: number
}

export class LedgerService {
  private baseUrl: string
  private ledgerId: string
  private clientId: string
  private clientSecret: string
  private tokenEndpoint: string
  private accessToken: OAuthToken | null = null

  constructor(
    baseUrl: string = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/ledger/v2',
    ledgerId: string = 'baas_ledger',
    clientId: string = '38c6862b-327c-4c7c-b93c-00c0fac5a05f',
    clientSecret: string = '6881226f-ad85-4206-aa67-ccdd1031dc2b',
    tokenEndpoint: string = 'https://htelokuekgot-tfyo.us-east-1.formance.cloud/api/auth/oauth/token'
  ) {
    this.baseUrl = baseUrl
    this.ledgerId = ledgerId
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.tokenEndpoint = tokenEndpoint
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.accessToken.expires_at && Date.now() < this.accessToken.expires_at) {
      return this.accessToken.access_token
    }

    // Request new token
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
    }

    const tokenData: OAuthToken = await response.json()
    this.accessToken = {
      ...tokenData,
      expires_at: Date.now() + (tokenData.expires_in * 1000) - 60000 // 1 minute buffer
    }

    return this.accessToken.access_token
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const token = await this.getAccessToken()
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API request failed:`, error)
      throw error
    }
  }

  async getAccounts(): Promise<Account[]> {
    const response = await this.makeRequest(`/${this.ledgerId}/accounts`)
    return response.data || []
  }

  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    const response = await this.makeRequest(`/${this.ledgerId}/transactions?limit=${limit}`)
    return response.data || []
  }

  async getBalances(): Promise<Balance[]> {
    const response = await this.makeRequest(`/${this.ledgerId}/balances`)
    return response.data || []
  }

  async getAccountBalance(account: string): Promise<Balance | null> {
    const response = await this.makeRequest(`/${this.ledgerId}/balances?account=${account}`)
    const balances = response.data || []
    return balances.length > 0 ? balances[0] : null
  }

  async getStats(): Promise<LedgerStats> {
    const [accountsResponse, transactionsResponse, balancesResponse] = await Promise.all([
      this.makeRequest(`/${this.ledgerId}/accounts`),
      this.makeRequest(`/${this.ledgerId}/transactions`),
      this.makeRequest(`/${this.ledgerId}/balances`)
    ])

    const accounts = accountsResponse.data || []
    const transactions = transactionsResponse.data || []
    const balances = balancesResponse.data || []

    const totalVolume = transactions.reduce((sum: number, tx: Transaction) => 
      sum + tx.postings.reduce((txSum: number, p: any) => txSum + p.amount, 0), 0)

    const activeAccounts = accounts.filter((a: Account) => 
      balances.some((b: Balance) => b.account === a.address && b.balance > 0)
    ).length

    return {
      totalAccounts: accounts.length,
      totalTransactions: transactions.length,
      totalVolume,
      activeAccounts
    }
  }

  async createTransaction(postings: any[], reference?: string, metadata?: any): Promise<Transaction> {
    const transactionData = {
      postings,
      reference,
      metadata
    }

    const response = await this.makeRequest(`/${this.ledgerId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData)
    })

    return response.data
  }

  async getTransactionsByAccount(account: string): Promise<Transaction[]> {
    const response = await this.makeRequest(`/${this.ledgerId}/transactions?account=${account}`)
    return response.data || []
  }

  async getTransactionsByType(type: string): Promise<Transaction[]> {
    const response = await this.makeRequest(`/${this.ledgerId}/transactions?metadata.type=${type}`)
    return response.data || []
  }
}

export const ledgerService = new LedgerService()
