import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, Zap, Eye, Shield, Target, BarChart3 } from 'lucide-react'
import { InsightsPanel } from '@/components/InsightsPanel'
import { TransactionFlow } from '@/components/TransactionFlow'
import { FinancialIntelligence } from '@/components/FinancialIntelligence'

export function IntelligenceDemo() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-600" />
            Behind the Scenes Intelligence
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Discover the powerful insights and capabilities that Formance Ledger enables behind the scenes
          </p>
        </div>
      </div>

      {/* Key Capabilities Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mb-4">
            <Brain className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
          <p className="text-sm text-gray-600">
            Real-time pattern detection, anomaly detection, and predictive analytics powered by machine learning
          </p>
        </div>

        <div className="card text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Atomic Operations</h3>
          <p className="text-sm text-gray-600">
            Guaranteed data integrity with all-or-nothing transaction processing and rollback capabilities
          </p>
        </div>

        <div className="card text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 mb-4">
            <Eye className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Monitoring</h3>
          <p className="text-sm text-gray-600">
            Continuous monitoring of financial health, risk assessment, and performance metrics
          </p>
        </div>

        <div className="card text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-4">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligent Recommendations</h3>
          <p className="text-sm text-gray-600">
            AI-driven suggestions for optimizing revenue, reducing costs, and improving efficiency
          </p>
        </div>
      </div>

      {/* Live Intelligence Demo */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
          Live Intelligence Demo
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InsightsPanel />
          <TransactionFlow transactionId="tx_intelligence_demo" />
        </div>
      </div>

      {/* Financial Intelligence */}
      <FinancialIntelligence />

      {/* Deep Dive into Capabilities */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="h-6 w-6 mr-3 text-green-600" />
          Deep Dive: What Formance Ledger Enables
        </h2>

        {/* Pattern Detection */}
        <div className="card">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Brain className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Pattern Detection</h3>
              <p className="text-gray-600 mb-4">
                Formance Ledger's atomic transaction model enables sophisticated pattern analysis that would be impossible with traditional databases.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Revenue Patterns</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Weekly/monthly revenue cycles</li>
                    <li>• Seasonal trend identification</li>
                    <li>• Customer behavior patterns</li>
                    <li>• Optimal pricing windows</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Anomaly Detection</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Unusual transaction volumes</li>
                    <li>• Fraud pattern recognition</li>
                    <li>• Suspicious account activity</li>
                    <li>• Risk score calculations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Analytics */}
        <div className="card">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Predictive Analytics</h3>
              <p className="text-gray-600 mb-4">
                The comprehensive audit trail and atomic nature of transactions enable highly accurate predictive models.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Financial Forecasting</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Cash flow predictions</li>
                    <li>• Revenue forecasting</li>
                    <li>• Customer lifetime value</li>
                    <li>• Market trend analysis</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Business Intelligence</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Growth opportunity identification</li>
                    <li>• Risk assessment and mitigation</li>
                    <li>• Operational efficiency insights</li>
                    <li>• Strategic decision support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Intelligence */}
        <div className="card">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Eye className="h-6 w-6" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Intelligence</h3>
              <p className="text-gray-600 mb-4">
                Every transaction triggers real-time analysis, enabling instant insights and automated responses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Instant Insights</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Real-time KPI updates</li>
                    <li>• Instant anomaly alerts</li>
                    <li>• Live performance monitoring</li>
                    <li>• Automated recommendations</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Automated Actions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Risk-based transaction blocking</li>
                    <li>• Automated fraud prevention</li>
                    <li>• Dynamic pricing adjustments</li>
                    <li>• Smart notification systems</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Unlock Financial Intelligence?
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Formance Ledger doesn't just process transactions - it transforms your financial data into actionable intelligence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/ecommerce"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            Explore Use Cases
          </Link>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
