export interface Account {
  address: string
  metadata?: Record<string, any>
  type?: string
}

export interface Transaction {
  id: string
  timestamp: string
  reference?: string
  metadata?: Record<string, any>
  postings: Posting[]
}

export interface Posting {
  source: string
  destination: string
  amount: number
  asset: string
}

export interface Balance {
  account: string
  asset: string
  balance: number
}

export interface LedgerStats {
  totalAccounts: number
  totalTransactions: number
  totalVolume: number
  activeAccounts: number
}

export interface UseCase {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
  demoPath: string
  color: string
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}
