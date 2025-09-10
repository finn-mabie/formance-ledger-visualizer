import { useState } from 'react'
import { useTransactionsByType } from '@/hooks/useLedger'
import { TransactionList } from '@/components/TransactionList'
import { StatsCard } from '@/components/StatsCard'
import { 
  Gamepad2, 
  Coins, 
  Users, 
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Trophy,
  Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const gamingRevenueData = [
  { month: 'Jan', revenue: 8500, players: 1200, transactions: 4500 },
  { month: 'Feb', revenue: 12000, players: 1500, transactions: 6200 },
  { month: 'Mar', revenue: 18000, players: 1800, transactions: 8900 },
  { month: 'Apr', revenue: 22000, players: 2100, transactions: 11000 },
  { month: 'May', revenue: 28000, players: 2400, transactions: 13500 },
  { month: 'Jun', revenue: 35000, players: 2800, transactions: 16800 },
]

const virtualCurrencyData = [
  { name: 'Gold Coins', value: 45, amount: 125000, color: '#f59e0b' },
  { name: 'Gems', value: 30, amount: 85000, color: '#8b5cf6' },
  { name: 'Energy', value: 15, amount: 42000, color: '#10b981' },
  { name: 'Premium', value: 10, amount: 28000, color: '#3b82f6' },
]

export function GamingDemo() {
  const { transactions: gamingTransactions } = useTransactionsByType('gaming')
  
  const totalRevenue = gamingTransactions.reduce((sum, tx) => 
    sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0)
  const totalTransactions = gamingTransactions.length
  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Gamepad2 className="h-8 w-8 mr-3 text-orange-600" />
            Gaming Demo
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            In-game currencies, virtual economies, and microtransactions with Formance Ledger
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gaming Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+25.3% from last month"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Active Players"
          value="2,800"
          change="+18.7% from last month"
          changeType="positive"
          icon={<Users className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Transactions"
          value={totalTransactions}
          change="+32.1% from last month"
          changeType="positive"
          icon={<Coins className="h-6 w-6" />}
        />
        <StatsCard
          title="Avg Transaction"
          value={`$${averageTransactionValue.toFixed(2)}`}
          change="+5.2% from last month"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gaming Revenue Growth */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gaming Revenue & Player Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gamingRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : name === 'players' ? 'Players' : 'Transactions'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="players" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Virtual Currency Distribution */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Virtual Currency Distribution</h3>
          <div className="space-y-4">
            {virtualCurrencyData.map((currency, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: currency.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{currency.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {currency.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{currency.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionList
          transactions={gamingTransactions.slice(0, 5)}
          title="Recent Gaming Transactions"
          showAccountDetails={true}
        />
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Players</h3>
          <div className="space-y-3">
            {[
              { name: 'Player_Alpha', level: 85, coins: 125000, rank: 1 },
              { name: 'Gamer_Beta', level: 78, coins: 98000, rank: 2 },
              { name: 'Pro_Gamma', level: 72, coins: 87000, rank: 3 },
              { name: 'Elite_Delta', level: 68, coins: 75000, rank: 4 },
              { name: 'Master_Echo', level: 65, coins: 68000, rank: 5 },
            ].map((player, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full text-sm font-bold">
                    {player.rank}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-500">Level {player.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {player.coins.toLocaleString()} coins
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gaming Features */}
      <div className="bg-orange-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gaming Features with Formance Ledger</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start space-x-3">
            <Coins className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Virtual Currencies</h4>
              <p className="text-sm text-gray-600">Manage multiple in-game currencies and tokens</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Gamepad2 className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Microtransactions</h4>
              <p className="text-sm text-gray-600">Process small-value in-game purchases</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Trophy className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Reward Systems</h4>
              <p className="text-sm text-gray-600">Distribute rewards and achievements</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Real-time Processing</h4>
              <p className="text-sm text-gray-600">Instant transaction processing for gameplay</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Player Wallets</h4>
              <p className="text-sm text-gray-600">Individual player account management</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Revenue Analytics</h4>
              <p className="text-sm text-gray-600">Track gaming revenue and player spending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
