import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { ECommerceDemo } from '@/pages/ECommerceDemo'
import { BankingDemo } from '@/pages/BankingDemo'
import { AccountingDemo } from '@/pages/AccountingDemo'
import { GamingDemo } from '@/pages/GamingDemo'
import { MarketplaceDemo } from '@/pages/MarketplaceDemo'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ecommerce" element={<ECommerceDemo />} />
        <Route path="/banking" element={<BankingDemo />} />
        <Route path="/accounting" element={<AccountingDemo />} />
        <Route path="/gaming" element={<GamingDemo />} />
        <Route path="/marketplace" element={<MarketplaceDemo />} />
      </Routes>
    </Layout>
  )
}

export default App
