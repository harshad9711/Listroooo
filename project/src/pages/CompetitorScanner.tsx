import React from "react";


import {
  Calculator, 
  Split, 
  TrendingUp, 
  Package, 
  Brain, 
  LineChart, 
  Users, 
  BarChart2, 
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import ProfitSimulator from '../components/scanner/ProfitSimulator';
import AdSpyDashboard from '../components/scanner/AdSpyDashboard';

const brandOSModules = [
  {
    id: 'product-pipeline',
    name: 'Product Pipeline',
    description: 'Plan and track your product launches',
    icon: <Package className="h-6 w-6 text-indigo-500" />,
    link: '/competitor-scanner/pipeline'
  },
  {
    id: 'ai-planner',
    name: 'AI Launch Planner',
    description: 'AI-powered launch strategies',
    icon: <Brain className="h-6 w-6 text-purple-500" />,
    link: '/competitor-scanner/planner'
  },
  {
    id: 'campaign-memory',
    name: 'Campaign Memory',
    description: 'Track campaign performance',
    icon: <LineChart className="h-6 w-6 text-blue-500" />,
    link: '/competitor-scanner/campaigns'
  },
  {
    id: 'creator-crm',
    name: 'Creator CRM',
    description: 'Manage creator relationships',
    icon: <Users className="h-6 w-6 text-amber-500" />,
    link: '/competitor-scanner/crm'
  },
  {
    id: 'brand-pulse',
    name: 'Brand Pulse',
    description: 'Monitor brand health',
    icon: <BarChart2 className="h-6 w-6 text-rose-500" />,
    link: '/competitor-scanner/pulse'
  }
];

export default function CompetitorScanner() {
  const [showProfitSimulator, setShowProfitSimulator] = useState(false);
  const [showAdSpy, setShowAdSpy] = useState(false);

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Market Intelligence
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Analyze market trends and optimize your performance
          </p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowProfitSimulator(!showProfitSimulator)}
            className="btn-secondary"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {showProfitSimulator ? 'Hide Simulator' : 'Price & Profit Simulator'}
          </button>
          <button
            onClick={() => setShowAdSpy(!showAdSpy)}
            className="btn-secondary"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {showAdSpy ? 'Hide Ad Spy' : 'Ad Spy'}
          </button>
        </div>
      </div>

      {showProfitSimulator && (
        <div className="mb-6">
          <ProfitSimulator />
        </div>
      )}

      {showAdSpy && (
        <div className="mb-6">
          <AdSpyDashboard />
        </div>
      )}

      {/* BrandOS Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {brandOSModules.map((module) => (
          <Link
            key={module.id}
            to={module.link}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {module.icon}
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  {module.name}
                </h3>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {module.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}