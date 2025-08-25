import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet';
import * as Sentry from '@sentry/react';

// Error Boundary for individual routes
class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md">
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Page Error</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {this.state.error?.message || 'Something went wrong loading this page.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
import Pricing from './pages/Pricing';
import Automation from './pages/Automation';
import Chatbot from './pages/Chatbot';
import AdCreativePerformance from './pages/AdCreativePerformance';
import EmailSmsGenerator from './pages/EmailSmsGenerator';
import UGCDashboard from './pages/UGCDashboard';
import Veo3Production from './pages/Veo3Production';
import TermsOfService from './pages/TermsOfService';
import Verification from './pages/Verification';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

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
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { AiAssistantProvider } from './contexts/AiAssistantContext';
import AiAssistant from './components/assistant/AiAssistant';

// initialize monitoring
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
// datadogRum.init({
//   clientToken: import.meta.env.VITE_DD_CLIENT_TOKEN,
//   applicationId: import.meta.env.VITE_DD_APP_ID,
//   site: 'datadoghq.com',
//   service: 'listro-ui',
//   env: import.meta.env.MODE
// });

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
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="/forgot-password" element={<ForgotPassword/>}/>
            <Route path="/pricing" element={<Pricing/>}/>
            <Route path="/ad-creative-performance" element={<AdCreativePerformance/>}/>
            <Route path="/competitor-scanner" element={<CompetitorScanner/>}/>
            <Route path="/abtests" element={<ABTests/>}/>
            <Route path="/analytics" element={<Analytics/>}/>
            <Route path="/settings" element={<Settings/>}/>
            <Route path="/pricing" element={<Pricing/>}/>
            <Route path="/ad-creative-performance" element={<AdCreativePerformance/>}/>
            <Route path="/competitor-scanner" element={<CompetitorScanner/>}/>
            {/* Public routes */}
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
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
              <Route path="/products" element={<RouteErrorBoundary><Products /></RouteErrorBoundary>} />
              <Route path="/products/:id" element={<RouteErrorBoundary><ProductDetail /></RouteErrorBoundary>} />
              <Route path="/optimize" element={<RouteErrorBoundary><AIOptimizer /></RouteErrorBoundary>} />
              <Route path="/marketing" element={<RouteErrorBoundary><MarketingDashboard /></RouteErrorBoundary>} />
              <Route path="/automation" element={<RouteErrorBoundary><Automation /></RouteErrorBoundary>} />
              <Route path="/chatbot" element={<RouteErrorBoundary><Chatbot /></RouteErrorBoundary>} />
              <Route path="/ad-performance" element={<RouteErrorBoundary><AdCreativePerformance /></RouteErrorBoundary>} />
              <Route path="/email-sms-generator" element={<RouteErrorBoundary><EmailSmsGenerator /></RouteErrorBoundary>} />
              <Route path="/veo3-production" element={<RouteErrorBoundary><Veo3Production /></RouteErrorBoundary>} />
              <Route path="/ugc" element={<RouteErrorBoundary><UGCDashboard /></RouteErrorBoundary>} />
              
              {/* Market Intelligence section */}
              <Route path="/competitor-scanner" element={<RouteErrorBoundary><CompetitorScanner /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/pipeline" element={<RouteErrorBoundary><ProductPipeline /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/ugc" element={<RouteErrorBoundary><UGCLibrary /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/planner" element={<RouteErrorBoundary><AILaunchPlanner /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/campaigns" element={<RouteErrorBoundary><CampaignMemory /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/crm" element={<RouteErrorBoundary><CreatorCRM /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/pulse" element={<RouteErrorBoundary><BrandPulse /></RouteErrorBoundary>} />
              <Route path="/competitor-scanner/events" element={<RouteErrorBoundary><LiveEvents /></RouteErrorBoundary>} />
              
              <Route path="/ab-tests" element={<RouteErrorBoundary><ABTests /></RouteErrorBoundary>} />
              <Route path="/ab-tests/:id" element={<RouteErrorBoundary><ABTestDetail /></RouteErrorBoundary>} />
              <Route path="/analytics" element={<RouteErrorBoundary><Analytics /></RouteErrorBoundary>} />
              <Route path="/platform-integrations" element={<RouteErrorBoundary><PlatformIntegrations /></RouteErrorBoundary>} />
              <Route path="/settings" element={<RouteErrorBoundary><Settings /></RouteErrorBoundary>} />

              {/* Dashboard feature routes */}
              <Route path="/dashboard/inventory" element={<RouteErrorBoundary><InventoryOrchestrator /></RouteErrorBoundary>} />
            </Route>
            
            {/* Root redirect - go to dashboard if authenticated, otherwise to pricing */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
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

