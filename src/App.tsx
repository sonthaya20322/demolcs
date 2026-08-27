import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { DailyReportPage } from './pages/DailyReportPage'
import { IssueQueuePage } from './pages/IssueQueuePage'
import { ProductsPage } from './pages/ProductsPage'
import { StockPage } from './pages/StockPage'
import { StockReceivePage } from './pages/StockReceivePage'
import { SessionProvider, useSession } from './session/SessionContext'

function AppRoutes() {
  const { ready, repository, error } = useSession()

  if (!ready) {
    return <div className="loading">กำลังเตรียมร้านตัวอย่าง DemoDainamo...</div>
  }

  if (!repository) {
    return (
      <div className="loading">
        <p className="error-text">{error ?? 'ไม่สามารถเริ่มระบบสาธิตได้'}</p>
      </div>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/stock/receive" element={<StockReceivePage />} />
        <Route path="/issues" element={<IssueQueuePage />} />
        <Route path="/reports" element={<DailyReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </BrowserRouter>
  )
}
