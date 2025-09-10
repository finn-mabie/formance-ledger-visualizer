import { useState, useEffect } from 'react'
import { ledgerService } from '@/services/ledgerService'
import { Account, Transaction, Balance, LedgerStats } from '@/types/ledger'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true)
        const data = await ledgerService.getAccounts()
        setAccounts(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  return { accounts, loading, error }
}

export function useTransactions(limit?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const data = await ledgerService.getTransactions(limit)
        setTransactions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [limit])

  return { transactions, loading, error }
}

export function useBalances() {
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true)
        const data = await ledgerService.getBalances()
        setBalances(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch balances')
      } finally {
        setLoading(false)
      }
    }

    fetchBalances()
  }, [])

  return { balances, loading, error }
}

export function useStats() {
  const [stats, setStats] = useState<LedgerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await ledgerService.getStats()
        setStats(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

export function useAccountTransactions(account: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!account) return

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const data = await ledgerService.getTransactionsByAccount(account)
        setTransactions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [account])

  return { transactions, loading, error }
}

export function useTransactionsByType(type: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!type) return

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const data = await ledgerService.getTransactionsByType(type)
        setTransactions(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions by type')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [type])

  return { transactions, loading, error }
}
