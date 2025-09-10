import React from 'react'
import { Balance } from '@/types/ledger'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface AccountBalanceProps {
  balance: Balance
  showTrend?: boolean
  trendValue?: number
}

export function AccountBalance({ balance, showTrend = false, trendValue = 0 }: AccountBalanceProps) {
  const isPositive = balance.balance >= 0
  const trendIcon = trendValue > 0 ? TrendingUp : trendValue < 0 ? TrendingDown : null
  const trendColor = trendValue > 0 ? 'text-success-600' : trendValue < 0 ? 'text-danger-600' : 'text-gray-500'

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {balance.account}
          </h3>
          <div className="flex items-center mt-1">
            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-lg font-bold text-gray-900">
              {balance.balance.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">{balance.asset}</span>
          </div>
          {showTrend && trendIcon && (
            <div className={`flex items-center text-xs mt-1 ${trendColor}`}>
              {React.createElement(trendIcon, { className: "h-3 w-3 mr-1" })}
              {trendValue > 0 ? '+' : ''}{trendValue.toFixed(2)}%
            </div>
          )}
        </div>
        <div className={`w-3 h-3 rounded-full ${isPositive ? 'bg-success-400' : 'bg-danger-400'}`} />
      </div>
    </div>
  )
}
