import { useState } from 'react'
import { useTransactionsByType } from '@/hooks/useLedger'
import { TransactionList } from '@/components/TransactionList'
import { StatsCard } from '@/components/StatsCard'
import { 
  Store, 
  Users, 
  TrendingUp, 
  DollarSign,
  ArrowLeft,
  Shield,
  Percent,
  Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const marketplaceData = [
  { month: 'Jan', revenue: 45000, vendors: 45, transactions: 1200 },
  { month: 'Feb', revenue: 52000, vendors: 52, transactions: 1400 },
  { month: 'Mar', revenue: 61000, vendors: 58, transactions: 1650 },
  { month: 'Apr', revenue: 68000, vendors: 65, transactions: 1800 },
  { month: 'May', revenue: 75000, vendors: 72, transactions: 2000 },
  { month: 'Jun', revenue: 82000, vendors: 80, transactions: 2200 },
]

const commissionData = [
  { name: 'Electronics', value: 35, amount: 28700, color: '#3b82f6' },
  { name: 'Fashion', value: 25, amount: 20500, color: '#10b981' },
  { name: 'Home & Garden', value: 20, amount: 16400, color: '#f59e0b' },
  { name: 'Books', value: 10, amount: 8200, color: '#8b5cf6' },
  { name: 'Other', value: 10, amount: 8200, color: '#6b7280' },
]

export function MarketplaceDemo() {
  const { transactions: marketplaceTransactions } = useTransactionsByType('marketplace')
  
  const totalRevenue = marketplaceTransactions.reduce((sum, tx) => 
    sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0)
  const totalTransactions = marketplaceTransactions.length
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
  const commissionRate = 0.15 // 15% commission
  const totalCommissions = totalRevenue * commissionRate

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Store className="h-8 w-8 mr-3 text-pink-600" />
            Marketplace Demo
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Multi-vendor payments, escrow, and commission tracking with Formance Ledger
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+18.5% from last month"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Active Vendors"
          value="80"
          change="+12.3% from last month"
          changeType="positive"
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Transactions"
          value={totalTransactions}
          change="+22.1% from last month"
          changeType="positive"
          icon={<Store className="h-6 w-6" />}
        />
        <StatsCard
          title="Platform Commissions"
          value={`$${totalCommissions.toLocaleString()}`}
          change="+18.5% from last month"
          changeType="positive"
          icon={<Percent className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Marketplace Growth */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Marketplace Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={marketplaceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : name === 'vendors' ? 'Vendors' : 'Transactions'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#ec4899" 
                strokeWidth={2}
                dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="vendors" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Commission by Category */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commissionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="amount" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionList
          transactions={marketplaceTransactions.slice(0, 5)}
          title="Recent Marketplace Transactions"
          showAccountDetails={true}
        />
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Vendors</h3>
          <div className="space-y-3">
            {[
              { name: 'TechStore Pro', sales: 125000, commission: 18750, rank: 1 },
              { name: 'Fashion Hub', sales: 98000, commission: 14700, rank: 2 },
              { name: 'Home Decor Co', sales: 87000, commission: 13050, rank: 3 },
              { name: 'Book World', sales: 75000, commission: 11250, rank: 4 },
              { name: 'Garden Supplies', sales: 68000, commission: 10200, rank: 5 },
            ].map((vendor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-pink-100 text-pink-600 rounded-full text-sm font-bold">
                    {vendor.rank}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-xs text-gray-500">Commission: ${vendor.commission.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    ${vendor.sales.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Total Sales</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marketplace Features */}
      <div className="bg-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Marketplace Features with Formance Ledger</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start space-x-3">
            <Store className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Multi-Vendor Support</h4>
              <p className="text-sm text-gray-600">Manage payments for multiple vendors and sellers</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Escrow Services</h4>
              <p className="text-sm text-gray-600">Secure payment holding until order completion</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Percent className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Commission Tracking</h4>
              <p className="text-sm text-gray-600">Automated commission calculation and distribution</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Settlement Processing</h4>
              <p className="text-sm text-gray-600">Automated vendor payouts and settlements</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Vendor Management</h4>
              <p className="text-sm text-gray-600">Track vendor performance and payment history</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-pink-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Revenue Analytics</h4>
              <p className="text-sm text-gray-600">Detailed marketplace financial reporting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
