import { useTransactionsByType, useStats, useBalances } from '@/hooks/useLedger'
import { TransactionList } from '@/components/TransactionList'
import { StatsCard } from '@/components/StatsCard'
import { DualPanelLayout } from '@/components/DualPanelLayout'
import { TransactionForm } from '@/components/TransactionForm'
import { QuickActions } from '@/components/QuickActions'
import { 
  ShoppingCart, 
  CreditCard, 
  Package, 
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 12000, orders: 45 },
  { month: 'Feb', revenue: 15000, orders: 52 },
  { month: 'Mar', revenue: 18000, orders: 68 },
  { month: 'Apr', revenue: 22000, orders: 75 },
  { month: 'May', revenue: 25000, orders: 82 },
  { month: 'Jun', revenue: 28000, orders: 95 },
]

const paymentMethodData = [
  { name: 'Credit Card', value: 45, color: '#3b82f6' },
  { name: 'PayPal', value: 30, color: '#10b981' },
  { name: 'Bank Transfer', value: 15, color: '#f59e0b' },
  { name: 'Crypto', value: 10, color: '#8b5cf6' },
]

export function ECommerceDemo() {
  const { transactions: paymentTransactions, refresh: refreshPayments } = useTransactionsByType('payment')
  const { transactions: purchaseTransactions, refresh: refreshPurchases } = useTransactionsByType('purchase')
  const { stats, refresh: refreshStats } = useStats()
  const { balances, refresh: refreshBalances } = useBalances()
  
  const totalRevenue = paymentTransactions.reduce((sum, tx) => 
    sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0)
  const totalOrders = purchaseTransactions.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const handleTransactionCreated = () => {
    refreshPayments()
    refreshPurchases()
    refreshStats()
    refreshBalances()
  }

  return (
    <DualPanelLayout
      useCase="ecommerce"
      title="E-Commerce Demo"
      description="Payment processing, order management, and revenue tracking with Formance Ledger"
      transactionId="tx_ecommerce_demo"
    >

      {/* Interactive Transaction Creation */}
      <div className="space-y-6">
        <QuickActions 
          useCase="ecommerce" 
          onTransactionCreated={handleTransactionCreated}
        />
        <TransactionForm 
          useCase="ecommerce" 
          onTransactionCreated={handleTransactionCreated}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+12.5% from last month"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          change="+8.2% from last month"
          changeType="positive"
          icon={<Package className="h-6 w-6" />}
        />
        <StatsCard
          title="Average Order Value"
          value={`$${averageOrderValue.toFixed(2)}`}
          change="+3.1% from last month"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Active Customers"
          value={stats?.activeAccounts || 0}
          change="+15.3% from last month"
          changeType="positive"
          icon={<Users className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionList
          transactions={paymentTransactions.slice(0, 5)}
          title="Recent Payments"
          showAccountDetails={true}
        />
        <TransactionList
          transactions={purchaseTransactions.slice(0, 5)}
          title="Recent Orders"
          showAccountDetails={true}
        />
      </div>

      {/* E-commerce Features */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">E-commerce Features with Formance Ledger</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start space-x-3">
            <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Multi-Payment Support</h4>
              <p className="text-sm text-gray-600">Accept various payment methods and currencies</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Order Tracking</h4>
              <p className="text-sm text-gray-600">Real-time order status and payment tracking</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Revenue Analytics</h4>
              <p className="text-sm text-gray-600">Detailed financial reporting and insights</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Customer Management</h4>
              <p className="text-sm text-gray-600">Track customer payment history and preferences</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Refund Processing</h4>
              <p className="text-sm text-gray-600">Automated refund and return handling</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ShoppingCart className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Inventory Integration</h4>
              <p className="text-sm text-gray-600">Sync payments with inventory management</p>
            </div>
          </div>
        </div>
      </div>
    </DualPanelLayout>
  )
}
