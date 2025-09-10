import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Brain,
  DollarSign,
  BarChart3,
  Zap,
  Eye,
  Shield
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface FinancialMetric {
  name: string
  current: number
  previous: number
  trend: 'up' | 'down' | 'stable'
  change: number
  insight: string
  recommendation: string
}

interface PredictiveData {
  period: string
  actual: number | null
  predicted: number
  confidence: number
}

const mockFinancialMetrics: FinancialMetric[] = [
  {
    name: 'Revenue Velocity',
    current: 125000,
    previous: 98000,
    trend: 'up',
    change: 27.6,
    insight: 'Revenue growing 27.6% faster than last period',
    recommendation: 'Consider expanding marketing budget to capitalize on growth momentum'
  },
  {
    name: 'Customer Acquisition Cost',
    current: 45.20,
    previous: 52.80,
    trend: 'down',
    change: -14.4,
    insight: 'CAC decreased by 14.4% due to improved conversion rates',
    recommendation: 'Increase acquisition spend while maintaining current efficiency'
  },
  {
    name: 'Average Transaction Value',
    current: 156.80,
    previous: 142.30,
    trend: 'up',
    change: 10.2,
    insight: 'ATV increased 10.2% driven by premium product adoption',
    recommendation: 'Promote cross-selling to further increase ATV'
  },
  {
    name: 'Cash Flow Risk Score',
    current: 23,
    previous: 45,
    trend: 'down',
    change: -48.9,
    insight: 'Cash flow risk significantly reduced due to improved collections',
    recommendation: 'Consider strategic investments or debt reduction'
  }
]

const mockPredictiveData: PredictiveData[] = [
  { period: 'Week 1', actual: 12000, predicted: 11800, confidence: 92 },
  { period: 'Week 2', actual: 13500, predicted: 13200, confidence: 89 },
  { period: 'Week 3', actual: 14800, predicted: 15100, confidence: 94 },
  { period: 'Week 4', actual: 16200, predicted: 16500, confidence: 91 },
  { period: 'Week 5', actual: null, predicted: 17800, confidence: 87 },
  { period: 'Week 6', actual: null, predicted: 19200, confidence: 84 },
  { period: 'Week 7', actual: null, predicted: 20800, confidence: 81 },
  { period: 'Week 8', actual: null, predicted: 22500, confidence: 78 }
]

export function FinancialIntelligence() {
  const [metrics, setMetrics] = useState<FinancialMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics(mockFinancialMetrics)
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const getTrendIcon = (trend: FinancialMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: FinancialMetric['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          Financial Intelligence
        </h3>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          Real-time Financial Intelligence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getTrendColor(metric.trend)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {metric.name}
                </h4>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(metric.trend)}
                  <span className="text-sm font-medium">
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {typeof metric.current === 'number' && metric.current > 1000
                  ? `$${metric.current.toLocaleString()}`
                  : `$${metric.current.toFixed(2)}`}
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {metric.insight}
              </p>
              <div className="text-xs text-blue-600 font-medium">
                💡 {metric.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Predictive Revenue Analytics
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockPredictiveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value ? `$${value.toLocaleString()}` : 'N/A',
                  name === 'actual' ? 'Actual' : 'Predicted'
                ]}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stackId="2"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <Eye className="h-4 w-4" />
            <span className="font-medium">AI Prediction:</span>
            <span>Next 4 weeks projected revenue: $80,300 (avg confidence: 85%)</span>
          </div>
        </div>
      </div>

      {/* Behind the Scenes Capabilities */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-600" />
          What Formance Ledger Enables
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Real-time Pattern Detection</h4>
            </div>
            <p className="text-sm text-gray-600">
              Every transaction is analyzed in real-time for patterns, anomalies, and opportunities using machine learning algorithms.
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Predictive Analytics</h4>
            </div>
            <p className="text-sm text-gray-600">
              Historical transaction data enables accurate predictions of future trends, cash flow, and business performance.
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Intelligent Recommendations</h4>
            </div>
            <p className="text-sm text-gray-600">
              AI-powered insights provide actionable recommendations for optimizing revenue, reducing costs, and improving efficiency.
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-gray-900">Risk Detection</h4>
            </div>
            <p className="text-sm text-gray-600">
              Advanced fraud detection and risk assessment based on transaction patterns, velocity, and behavioral analysis.
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-gray-900">Financial Health Monitoring</h4>
            </div>
            <p className="text-sm text-gray-600">
              Continuous monitoring of cash flow, liquidity, and financial health with early warning systems for potential issues.
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h4 className="font-medium text-gray-900">Advanced Reporting</h4>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive financial reports, KPI tracking, and custom analytics dashboards powered by transaction data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
