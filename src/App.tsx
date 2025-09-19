import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Designer } from '@/pages/Designer'
import { Marketplace } from '@/pages/Marketplace'
import { ConnectivityVisualizer } from '@/pages/ConnectivityVisualizer'
import { OrchestrationVisualizer } from '@/pages/OrchestrationVisualizer'
import ReconciliationVisualizer from '@/pages/ReconciliationVisualizer'
import { QueryConsole } from './pages/QueryConsole'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/designer" replace />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/connectivity" element={<ConnectivityVisualizer />} />
        <Route path="/orchestration" element={<OrchestrationVisualizer />} />
        <Route path="/reconciliation" element={<ReconciliationVisualizer />} />
        <Route path="/query" element={<QueryConsole />} />
        <Route path="*" element={<Navigate to="/designer" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
