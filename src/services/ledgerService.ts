import { LedgerApi } from '@formancehq/formance-sdk-typescript'
import { Account, Transaction, Balance, LedgerStats } from '@/types/ledger'

// Mock data for demonstration purposes
// In a real implementation, you would use the actual Formance SDK
const MOCK_ACCOUNTS: Account[] = [
  { address: 'user:alice', metadata: { name: 'Alice Johnson', type: 'customer' } },
  { address: 'user:bob', metadata: { name: 'Bob Smith', type: 'customer' } },
  { address: 'user:charlie', metadata: { name: 'Charlie Brown', type: 'merchant' } },
  { address: 'bank:main', metadata: { name: 'Main Bank Account', type: 'bank' } },
  { address: 'revenue:sales', metadata: { name: 'Sales Revenue', type: 'revenue' } },
  { address: 'expense:marketing', metadata: { name: 'Marketing Expenses', type: 'expense' } },
  { address: 'asset:cash', metadata: { name: 'Cash Account', type: 'asset' } },
  { address: 'liability:debt', metadata: { name: 'Debt Account', type: 'liability' } },
]

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_001',
    timestamp: '2024-01-15T10:30:00Z',
    reference: 'Payment from Alice',
    metadata: { type: 'payment', source: 'ecommerce' },
    postings: [
      { source: 'user:alice', destination: 'bank:main', amount: 100, asset: 'USD' }
    ]
  },
  {
    id: 'tx_002',
    timestamp: '2024-01-15T11:15:00Z',
    reference: 'Purchase at Store',
    metadata: { type: 'purchase', source: 'ecommerce' },
    postings: [
      { source: 'bank:main', destination: 'user:charlie', amount: 75, asset: 'USD' },
      { source: 'user:charlie', destination: 'revenue:sales', amount: 75, asset: 'USD' }
    ]
  },
  {
    id: 'tx_003',
    timestamp: '2024-01-15T14:20:00Z',
    reference: 'Marketing Campaign',
    metadata: { type: 'expense', source: 'accounting' },
    postings: [
      { source: 'bank:main', destination: 'expense:marketing', amount: 500, asset: 'USD' }
    ]
  },
  {
    id: 'tx_004',
    timestamp: '2024-01-16T09:00:00Z',
    reference: 'Salary Payment',
    metadata: { type: 'salary', source: 'banking' },
    postings: [
      { source: 'bank:main', destination: 'user:bob', amount: 2500, asset: 'USD' }
    ]
  },
  {
    id: 'tx_005',
    timestamp: '2024-01-16T16:45:00Z',
    reference: 'Gaming Purchase',
    metadata: { type: 'gaming', source: 'gaming' },
    postings: [
      { source: 'user:alice', destination: 'bank:main', amount: 25, asset: 'USD' },
      { source: 'bank:main', destination: 'revenue:gaming', amount: 25, asset: 'USD' }
    ]
  }
]

const MOCK_BALANCES: Balance[] = [
  { account: 'user:alice', asset: 'USD', balance: 150 },
  { account: 'user:bob', asset: 'USD', balance: 2500 },
  { account: 'user:charlie', asset: 'USD', balance: 75 },
  { account: 'bank:main', asset: 'USD', balance: 50000 },
  { account: 'revenue:sales', asset: 'USD', balance: 75 },
  { account: 'revenue:gaming', asset: 'USD', balance: 25 },
  { account: 'expense:marketing', asset: 'USD', balance: 500 },
  { account: 'asset:cash', asset: 'USD', balance: 10000 },
  { account: 'liability:debt', asset: 'USD', balance: 5000 }
]

export class LedgerService {
  private api: LedgerApi

  constructor(baseUrl: string = 'http://localhost:8080') {
    // In a real implementation, initialize the Formance SDK
    // this.api = new LedgerApi({ basePath: baseUrl })
    this.api = {} as LedgerApi
  }

  async getAccounts(): Promise<Account[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_ACCOUNTS
  }

  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_TRANSACTIONS.slice(0, limit)
  }

  async getBalances(): Promise<Balance[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_BALANCES
  }

  async getAccountBalance(account: string): Promise<Balance | null> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return MOCK_BALANCES.find(b => b.account === account) || null
  }

  async getStats(): Promise<LedgerStats> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      totalAccounts: MOCK_ACCOUNTS.length,
      totalTransactions: MOCK_TRANSACTIONS.length,
      totalVolume: MOCK_TRANSACTIONS.reduce((sum, tx) => 
        sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0),
      activeAccounts: MOCK_ACCOUNTS.filter(a => 
        MOCK_BALANCES.some(b => b.account === a.address && b.balance > 0)
      ).length
    }
  }

  async createTransaction(postings: any[], reference?: string, metadata?: any): Promise<Transaction> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newTransaction: Transaction = {
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
      reference,
      metadata,
      postings
    }

    MOCK_TRANSACTIONS.unshift(newTransaction)
    return newTransaction
  }

  async getTransactionsByAccount(account: string): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_TRANSACTIONS.filter(tx => 
      tx.postings.some(p => p.source === account || p.destination === account)
    )
  }

  async getTransactionsByType(type: string): Promise<Transaction[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_TRANSACTIONS.filter(tx => 
      tx.metadata?.type === type || tx.metadata?.source === type
    )
  }
}

export const ledgerService = new LedgerService()
