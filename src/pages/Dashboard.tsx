import { useStats, useTransactions, useBalances } from '@/hooks/useLedger'
import { StatsCard } from '@/components/StatsCard'
import { TransactionList } from '@/components/TransactionList'
import { AccountBalance } from '@/components/AccountBalance'
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Activity,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'

const useCases = [
  {
    id: 'ecommerce',
    title: 'E-Commerce',
    description: 'Payment processing, order management, and revenue tracking',
    icon: '🛒',
    color: 'bg-blue-500',
    href: '/ecommerce'
  },
  {
    id: 'banking',
    title: 'Banking',
    description: 'Account management, transfers, and financial services',
    icon: '🏦',
    color: 'bg-green-500',
    href: '/banking'
  },
  {
    id: 'accounting',
    title: 'Accounting',
    description: 'Double-entry bookkeeping, financial reporting, and compliance',
    icon: '📊',
    color: 'bg-purple-500',
    href: '/accounting'
  },
  {
    id: 'gaming',
    title: 'Gaming',
    description: 'In-game currencies, virtual economies, and microtransactions',
    icon: '🎮',
    color: 'bg-orange-500',
    href: '/gaming'
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Multi-vendor payments, escrow, and commission tracking',
    icon: '🏪',
    color: 'bg-pink-500',
    href: '/marketplace'
  }
]

export function Dashboard() {
  const { stats, loading: statsLoading } = useStats()
  const { transactions, loading: transactionsLoading } = useTransactions(10)
  const { balances, loading: balancesLoading } = useBalances()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Formance Ledger Visualizer</h1>
        <p className="mt-2 text-lg text-gray-600">
          Explore the power of Formance Ledger across different use cases and industries
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Accounts"
          value={stats?.totalAccounts || 0}
          icon={<Users className="h-6 w-6" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon={<CreditCard className="h-6 w-6" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Total Volume"
          value={`$${stats?.totalVolume?.toLocaleString() || 0}`}
          icon={<DollarSign className="h-6 w-6" />}
          loading={statsLoading}
        />
        <StatsCard
          title="Active Accounts"
          value={stats?.activeAccounts || 0}
          icon={<Activity className="h-6 w-6" />}
          loading={statsLoading}
        />
      </div>

      {/* Use Cases Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Use Case Demonstrations</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <Link
              key={useCase.id}
              to={useCase.href}
              className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:ring-gray-300 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center space-x-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${useCase.color} text-white text-2xl`}>
                  {useCase.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {useCase.description}
                  </p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <TransactionList
          transactions={transactions}
          loading={transactionsLoading}
          title="Recent Transactions"
        />

        {/* Account Balances */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Balances</h3>
          {balancesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {balances.slice(0, 10).map((balance) => (
                <AccountBalance key={`${balance.account}-${balance.asset}`} balance={balance} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Choose Formance Ledger?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Real-time Analytics</h3>
              <p className="mt-2 text-sm text-gray-600">
                Get instant insights into your financial data with real-time reporting
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-white">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Scalable Architecture</h3>
              <p className="mt-2 text-sm text-gray-600">
                Built to handle high-volume transactions and complex financial operations
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-white">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Multi-Asset Support</h3>
              <p className="mt-2 text-sm text-gray-600">
                Handle multiple currencies, tokens, and digital assets in a single ledger
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Programmable Logic</h3>
              <p className="mt-2 text-sm text-gray-600">
                Use Numscript to create complex financial workflows and business logic
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
