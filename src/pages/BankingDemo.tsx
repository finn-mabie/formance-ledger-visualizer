import { useTransactionsByType, useStats, useBalances } from '@/hooks/useLedger'
import { TransactionList } from '@/components/TransactionList'
import { StatsCard } from '@/components/StatsCard'
import { DualPanelLayout } from '@/components/DualPanelLayout'
import { TransactionForm } from '@/components/TransactionForm'
import { QuickActions } from '@/components/QuickActions'
import { 
  CreditCard, 
  Users, 
  TrendingUp,
  DollarSign,
  Shield,
  Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const accountGrowthData = [
  { month: 'Jan', accounts: 1200, deposits: 45000 },
  { month: 'Feb', accounts: 1350, deposits: 52000 },
  { month: 'Mar', accounts: 1480, deposits: 61000 },
  { month: 'Apr', accounts: 1620, deposits: 68000 },
  { month: 'May', accounts: 1750, deposits: 75000 },
  { month: 'Jun', accounts: 1900, deposits: 82000 },
]

const transactionTypesData = [
  { name: 'Transfers', value: 45, color: '#3b82f6' },
  { name: 'Deposits', value: 25, color: '#10b981' },
  { name: 'Withdrawals', value: 15, color: '#f59e0b' },
  { name: 'Loans', value: 10, color: '#8b5cf6' },
  { name: 'Other', value: 5, color: '#6b7280' },
]

export function BankingDemo() {
  const { transactions: salaryTransactions, refresh: refreshSalary } = useTransactionsByType('salary')
  const { transactions: transferTransactions, refresh: refreshTransfers } = useTransactionsByType('transfer')
  const { stats, refresh: refreshStats } = useStats()
  const { balances, refresh: refreshBalances } = useBalances()
  
  const totalDeposits = salaryTransactions.reduce((sum, tx) => 
    sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0)
  const totalTransfers = transferTransactions.length
  const averageDeposit = salaryTransactions.length > 0 ? totalDeposits / salaryTransactions.length : 0

  const handleTransactionCreated = () => {
    refreshSalary()
    refreshTransfers()
    refreshStats()
    refreshBalances()
  }

  return (
    <DualPanelLayout
      useCase="banking"
      title="Banking Demo"
      description="Account management, transfers, and financial services with Formance Ledger"
      transactionId="tx_banking_demo"
    >

      {/* Interactive Transaction Creation */}
      <div className="space-y-6">
        <QuickActions 
          useCase="banking" 
          onTransactionCreated={handleTransactionCreated}
        />
        <TransactionForm 
          useCase="banking" 
          onTransactionCreated={handleTransactionCreated}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Deposits"
          value={`$${totalDeposits.toLocaleString()}`}
          change="+8.2% from last month"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Active Accounts"
          value={stats?.activeAccounts || 0}
          change="+12.5% from last month"
          changeType="positive"
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Transfers"
          value={totalTransfers}
          change="+15.3% from last month"
          changeType="positive"
          icon={<CreditCard className="h-6 w-6" />}
        />
        <StatsCard
          title="Average Deposit"
          value={`$${averageDeposit.toFixed(2)}`}
          change="+3.1% from last month"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Growth */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Growth & Deposits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accountGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'accounts' ? value : `$${value.toLocaleString()}`,
                  name === 'accounts' ? 'Accounts' : 'Deposits'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="accounts" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="deposits" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transaction Types */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionTypesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionList
          transactions={salaryTransactions.slice(0, 5)}
          title="Recent Deposits"
          showAccountDetails={true}
        />
        <TransactionList
          transactions={transferTransactions.slice(0, 5)}
          title="Recent Transfers"
          showAccountDetails={true}
        />
      </div>

      {/* Banking Features */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Banking Features with Formance Ledger</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Account Management</h4>
              <p className="text-sm text-gray-600">Create and manage multiple account types</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Instant Transfers</h4>
              <p className="text-sm text-gray-600">Real-time money transfers between accounts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Security & Compliance</h4>
              <p className="text-sm text-gray-600">Built-in audit trails and regulatory compliance</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Interest Calculations</h4>
              <p className="text-sm text-gray-600">Automated interest and fee calculations</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Scheduled Payments</h4>
              <p className="text-sm text-gray-600">Automated recurring payments and transfers</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Multi-Currency</h4>
              <p className="text-sm text-gray-600">Support for multiple currencies and exchange rates</p>
            </div>
          </div>
        </div>
      </div>
    </DualPanelLayout>
  )
}
