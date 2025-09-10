import { useState } from 'react'
import { useTransactionsByType } from '@/hooks/useLedger'
import { TransactionList } from '@/components/TransactionList'
import { StatsCard } from '@/components/StatsCard'
import { 
  Calculator, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowLeft,
  BarChart3,
  Receipt
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const profitLossData = [
  { month: 'Jan', revenue: 12000, expenses: 8000, profit: 4000 },
  { month: 'Feb', revenue: 15000, expenses: 9000, profit: 6000 },
  { month: 'Mar', revenue: 18000, expenses: 10000, profit: 8000 },
  { month: 'Apr', revenue: 22000, expenses: 12000, profit: 10000 },
  { month: 'May', revenue: 25000, expenses: 13000, profit: 12000 },
  { month: 'Jun', revenue: 28000, expenses: 14000, profit: 14000 },
]

const expenseCategoriesData = [
  { name: 'Marketing', value: 35, amount: 14000, color: '#3b82f6' },
  { name: 'Operations', value: 25, amount: 10000, color: '#10b981' },
  { name: 'Salaries', value: 20, amount: 8000, color: '#f59e0b' },
  { name: 'Rent', value: 10, amount: 4000, color: '#8b5cf6' },
  { name: 'Other', value: 10, amount: 4000, color: '#6b7280' },
]

export function AccountingDemo() {
  const { transactions: expenseTransactions } = useTransactionsByType('expense')
  const { transactions: revenueTransactions } = useTransactionsByType('revenue')
  
  const totalRevenue = revenueTransactions.reduce((sum, tx) => 
    sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0)
  const totalExpenses = expenseTransactions.reduce((sum, tx) => 
    sum + tx.postings.reduce((txSum, p) => txSum + p.amount, 0), 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calculator className="h-8 w-8 mr-3 text-purple-600" />
            Accounting Demo
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Double-entry bookkeeping, financial reporting, and compliance with Formance Ledger
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          change="+12.5% from last month"
          changeType="positive"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString()}`}
          change="+5.2% from last month"
          changeType="negative"
          icon={<TrendingDown className="h-6 w-6" />}
        />
        <StatsCard
          title="Net Profit"
          value={`$${netProfit.toLocaleString()}`}
          change="+18.3% from last month"
          changeType="positive"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Profit Margin"
          value={`${profitMargin.toFixed(1)}%`}
          change="+2.1% from last month"
          changeType="positive"
          icon={<BarChart3 className="h-6 w-6" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profit & Loss */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profit & Loss Statement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={profitLossData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `$${value.toLocaleString()}`,
                  name === 'revenue' ? 'Revenue' : name === 'expenses' ? 'Expenses' : 'Profit'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                stackId="2"
                stroke="#ef4444" 
                fill="#ef4444"
                fillOpacity={0.6}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Categories */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
          <div className="space-y-4">
            {expenseCategoriesData.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    ${category.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{category.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransactionList
          transactions={revenueTransactions.slice(0, 5)}
          title="Recent Revenue"
          showAccountDetails={true}
        />
        <TransactionList
          transactions={expenseTransactions.slice(0, 5)}
          title="Recent Expenses"
          showAccountDetails={true}
        />
      </div>

      {/* Accounting Features */}
      <div className="bg-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Accounting Features with Formance Ledger</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start space-x-3">
            <Calculator className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Double-Entry Bookkeeping</h4>
              <p className="text-sm text-gray-600">Automatic balancing of debits and credits</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Financial Reports</h4>
              <p className="text-sm text-gray-600">Generate P&L, balance sheet, and cash flow statements</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Receipt className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Invoice Management</h4>
              <p className="text-sm text-gray-600">Track invoices, payments, and outstanding amounts</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Chart of Accounts</h4>
              <p className="text-sm text-gray-600">Organized account structure for financial tracking</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Budget Tracking</h4>
              <p className="text-sm text-gray-600">Monitor actual vs. budgeted expenses and revenue</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Tax Preparation</h4>
              <p className="text-sm text-gray-600">Export data for tax filing and compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
