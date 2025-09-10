import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Designer } from '@/pages/Designer'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/designer" replace />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="*" element={<Navigate to="/designer" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
