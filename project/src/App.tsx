import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import * as Sentry from '@sentry/react';
import { datadogRum } from '@datadog/browser-rum';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import AIOptimizer from './pages/AIOptimizer';
import CompetitorScanner from './pages/CompetitorScanner';
import ABTests from './pages/ABTests';
import ABTestDetail from './pages/ABTestDetail';
import Analytics from './pages/Analytics';
import MarketingDashboard from './pages/MarketingDashboard';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Pricing from './pages/Pricing';
import Automation from './pages/Automation';
import Chatbot from './pages/Chatbot';
import AdCreativePerformance from './pages/AdCreativePerformance';
import EmailSmsGenerator from './pages/EmailSmsGenerator';
import Veo3Production from './pages/Veo3Production';
import TermsOfService from './pages/TermsOfService';
import Verification from './pages/Verification';

// Market Intelligence Pages
import ProductPipeline from './pages/brandos/ProductPipeline';
import UGCLibrary from './pages/brandos/UGCLibrary';
import AILaunchPlanner from './pages/brandos/AILaunchPlanner';
import CampaignMemory from './pages/brandos/CampaignMemory';
import CreatorCRM from './pages/brandos/CreatorCRM';
import BrandPulse from './pages/brandos/BrandPulse';
import LiveEvents from './pages/brandos/LiveEvents';

// Dashboard Pages
import InventoryOrchestrator from './pages/dashboard/InventoryOrchestrator';

// Components
import PlatformIntegrations from './components/scanner/PlatformIntegrations';

// Auth provider
import { AuthProvider, RequireAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AiAssistantProvider } from './contexts/AiAssistantContext';
import AiAssistant from './components/assistant/AiAssistant';

// initialize monitoring
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
datadogRum.init({
  clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
  applicationId: import.meta.env.VITE_DD_APP_ID,
  site: 'datadoghq.com',
  service: 'listro-ui',
  env: import.meta.env.MODE
});

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AiAssistantProvider>
          <Helmet>
            <meta name="tiktok-developers-site-verification" content="HQk5C9P43EC4VP9SVN4qZYptUZFDByOz" />
          </Helmet>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Pricing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/verify" element={<Verification />} />
            
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            
            {/* Protected dashboard routes */}
            <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/optimize" element={<AIOptimizer />} />
              <Route path="/marketing" element={<MarketingDashboard />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/ad-performance" element={<AdCreativePerformance />} />
              <Route path="/email-sms-generator" element={<EmailSmsGenerator />} />
              <Route path="/veo3-production" element={<Veo3Production />} />
              
              {/* Market Intelligence section */}
              <Route path="/competitor-scanner" element={<CompetitorScanner />} />
              <Route path="/competitor-scanner/pipeline" element={<ProductPipeline />} />
              <Route path="/competitor-scanner/ugc" element={<UGCLibrary />} />
              <Route path="/competitor-scanner/planner" element={<AILaunchPlanner />} />
              <Route path="/competitor-scanner/campaigns" element={<CampaignMemory />} />
              <Route path="/competitor-scanner/crm" element={<CreatorCRM />} />
              <Route path="/competitor-scanner/pulse" element={<BrandPulse />} />
              <Route path="/competitor-scanner/events" element={<LiveEvents />} />
              
              <Route path="/ab-tests" element={<ABTests />} />
              <Route path="/ab-tests/:id" element={<ABTestDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/platform-integrations" element={<PlatformIntegrations />} />
              <Route path="/settings" element={<Settings />} />

              {/* Dashboard feature routes */}
              <Route path="/dashboard/inventory" element={<InventoryOrchestrator />} />
            </Route>
            
            {/* Redirect to dashboard if authenticated, otherwise to login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <AiAssistant />
        </AiAssistantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 