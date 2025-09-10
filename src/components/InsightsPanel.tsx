import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Zap, 
  Shield,
  Eye,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react'

interface Insight {
  id: string
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  timestamp: string
  category: string
}

const mockInsights: Insight[] = [
  {
    id: 'insight_001',
    type: 'pattern',
    title: 'Weekly Revenue Spike Pattern Detected',
    description: 'Revenue consistently increases 23% on Fridays, suggesting optimal timing for promotions',
    impact: 'high',
    confidence: 94,
    timestamp: '2024-01-16T10:30:00Z',
    category: 'Revenue Optimization'
  },
  {
    id: 'insight_002',
    type: 'anomaly',
    title: 'Unusual Transaction Volume Detected',
    description: 'Transaction volume 340% above normal for user:charlie between 2-4 PM',
    impact: 'medium',
    confidence: 87,
    timestamp: '2024-01-16T14:15:00Z',
    category: 'Fraud Detection'
  },
  {
    id: 'insight_003',
    type: 'opportunity',
    title: 'Cross-Sell Opportunity Identified',
    description: 'Users who purchase gaming items are 67% more likely to buy marketplace items within 48 hours',
    impact: 'high',
    confidence: 91,
    timestamp: '2024-01-16T09:45:00Z',
    category: 'Marketing Intelligence'
  },
  {
    id: 'insight_004',
    type: 'risk',
    title: 'Cash Flow Risk Alert',
    description: 'Projected cash flow may drop below safety threshold in 12 days based on current spending patterns',
    impact: 'high',
    confidence: 89,
    timestamp: '2024-01-16T08:20:00Z',
    category: 'Financial Health'
  },
  {
    id: 'insight_005',
    type: 'pattern',
    title: 'Customer Lifetime Value Prediction',
    description: 'New customers showing similar transaction patterns to high-value customers (LTV >$500)',
    impact: 'medium',
    confidence: 82,
    timestamp: '2024-01-16T07:10:00Z',
    category: 'Customer Analytics'
  }
]

const getInsightIcon = (type: Insight['type']) => {
  switch (type) {
    case 'pattern': return <BarChart3 className="h-5 w-5" />
    case 'anomaly': return <AlertTriangle className="h-5 w-5" />
    case 'opportunity': return <Target className="h-5 w-5" />
    case 'risk': return <Shield className="h-5 w-5" />
    default: return <Brain className="h-5 w-5" />
  }
}

const getInsightColor = (type: Insight['type'], impact: Insight['impact']) => {
  if (type === 'risk' || impact === 'high') return 'text-red-600 bg-red-50 border-red-200'
  if (type === 'opportunity' || impact === 'medium') return 'text-green-600 bg-green-50 border-green-200'
  return 'text-blue-600 bg-blue-50 border-blue-200'
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    // Simulate loading insights
    const timer = setTimeout(() => {
      setInsights(mockInsights)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const categories = ['all', ...Array.from(new Set(insights.map(i => i.category)))]
  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(i => i.category === selectedCategory)

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          AI-Powered Insights
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          AI-Powered Insights
        </h3>
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">Real-time Analysis</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'All Insights' : category}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border ${getInsightColor(insight.type, insight.impact)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {insight.title}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {insight.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      {insight.confidence}% confidence
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center">
                      <Zap className="h-3 w-3 mr-1" />
                      {insight.category}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Behind the Scenes Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Behind the Scenes:</span>
          <span>Formance Ledger enables real-time pattern analysis, anomaly detection, and predictive insights through its atomic transaction model and comprehensive audit trail.</span>
        </div>
      </div>
    </div>
  )
}
