import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { VantageLandingPage } from './pages/VantageLandingPage.tsx'
import { ConnectCloudPage } from './pages/ConnectCloudPage.tsx'
import { MultiCloudOverviewPage } from './pages/MultiCloudOverviewPage.tsx'
import { LinkedAccountsPage } from './pages/LinkedAccountsPage.tsx'
import { LinkedAccountDetailPage } from './pages/LinkedAccountDetailPage.tsx'
import { AzureSubscriptionsPage } from './pages/AzureSubscriptionsPage.tsx'
import { AzureSubscriptionDetailPage } from './pages/AzureSubscriptionDetailPage.tsx'
import { AuthProvider } from './lib/auth.tsx'

// Global Uncaught Error Loggers
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("🔴 [GLOBAL UNCAUGHT ERROR]:", event.message, event.error || event);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("🔴 [GLOBAL UNHANDLED PROMISE REJECTION]:", event.reason || event);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Vantage-Style Modern Landing Page */}
          <Route path="/" element={<VantageLandingPage />} />
          <Route path="/home" element={<VantageLandingPage />} />
          <Route path="/landing" element={<VantageLandingPage />} />

          {/* Onboarding Screen: Select AWS or Azure & Input Credentials */}
          <Route path="/connect" element={<ConnectCloudPage />} />

          {/* Multi-Cloud Command Center Overview */}
          <Route path="/overview" element={<MultiCloudOverviewPage />} />

          {/* Full AWS & Azure Analytics Dashboards */}
          <Route path="/aws" element={<App />} />
          <Route path="/dashboard" element={<App />} />
          <Route path="/azure" element={<App />} />

          {/* AWS Linked Accounts Directory */}
          <Route path="/linked-accounts" element={<LinkedAccountsPage />} />
          <Route path="/linked-accounts/:linkedAccountId/*" element={<LinkedAccountDetailPage />} />
          <Route path="/linked-accounts/:linkedAccountId" element={<LinkedAccountDetailPage />} />

          {/* Azure Subscriptions Directory */}
          <Route path="/azure/subscriptions" element={<AzureSubscriptionsPage />} />
          <Route path="/azure/linked-accounts" element={<AzureSubscriptionsPage />} />
          <Route path="/azure/subscriptions/:subscriptionId/*" element={<AzureSubscriptionDetailPage />} />
          <Route path="/azure/subscriptions/:subscriptionId" element={<AzureSubscriptionDetailPage />} />
          <Route path="/azure/linked-accounts/:subscriptionId/*" element={<AzureSubscriptionDetailPage />} />
          <Route path="/azure/linked-accounts/:subscriptionId" element={<AzureSubscriptionDetailPage />} />

          {/* Redirects */}
          <Route path="/newrequest" element={<Navigate to="/connect" replace />} />
          <Route path="/login" element={<Navigate to="/connect" replace />} />

          {/* Fallback Catch-all: redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
