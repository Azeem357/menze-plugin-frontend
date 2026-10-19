import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
// @ts-ignore -- Layout is a JavaScript component without a TypeScript declaration.
import Layout from './components/layout/Layout'
// @ts-ignore -- this page is JavaScript and does not provide a TypeScript declaration.
import DashboardPage from './pages/DashboardPage'
// @ts-ignore -- this page is JavaScript and does not provide a TypeScript declaration.
import AnalyticsPage from './pages/AnalyticsPage'
// @ts-ignore -- this page is JavaScript and does not provide a TypeScript declaration.
import SuggestionsPage from './pages/SuggestionsPage'

// Placeholder pages (build these next)
const FinancialPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-navy">
      Financial Metrics — Coming Soon
    </h2>
  </div>
)
const PredictionsPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-navy">
      AI Predictions — Coming Soon
    </h2>
  </div>
)
const CampaignsPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-navy">
      Campaigns — Coming Soon
    </h2>
  </div>
)
const ReportsPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-navy">
      Reports — Coming Soon
    </h2>
  </div>
)
const SetupPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold text-navy">
      Plugin Setup — Coming Soon
    </h2>
  </div>
)

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/analytics"
            element={<AnalyticsPage />}
          />
          <Route
            path="/financial"
            element={<FinancialPage />}
          />
          <Route
            path="/predictions"
            element={<PredictionsPage />}
          />
          <Route
            path="/suggestions"
            element={<SuggestionsPage />}
          />
          <Route
            path="/campaigns"
            element={<CampaignsPage />}
          />
          <Route
            path="/reports"
            element={<ReportsPage />}
          />
          <Route path="/setup" element={<SetupPage />} />
        </Routes>
      </Layout>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        theme="light"
      />
    </BrowserRouter>
  )
}

export default App