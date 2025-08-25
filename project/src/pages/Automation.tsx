import { useState } from 'react';

import {
  Zap, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Download
} from 'lucide-react';
import TriggerEngine from '../components/automation/TriggerEngine';
import WorkflowPlaybooks from '../components/automation/WorkflowPlaybooks';
import IntelligentReminders from '../components/automation/IntelligentReminders';

interface Automation {
  id: string;
  name: string;
  type: 'trigger' | 'playbook' | 'reminder';
  status: 'active' | 'paused' | 'draft';
  lastRun?: string;
  nextRun?: string;
  runsCount: number;
  successRate: number;
}

export default function Automation() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);

  // useEffect(() => {
  //   fetch(`${import.meta.env.VITE_API_URL}/automation`)
  //     .then(res => res.json())
  //     .then(data => setAutomations(data));
  // }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <Play className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Draft
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="h-5 w-5 text-indigo-500" />;
      case 'playbook':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'reminder':
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Automation & Workflows</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            AI-driven automation and workflow orchestration
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className="h-4 w-4 mr-2" />
            New Automation
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
              { id: 'triggers', name: 'Trigger Engine', icon: <Zap className="h-4 w-4" /> },
              { id: 'playbooks', name: 'Playbooks', icon: <FileText className="h-4 w-4" /> },
              { id: 'reminders', name: 'Reminders', icon: <Settings className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Automations</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {/* {automations.filter(a => a.status === 'active').length} */}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Runs</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {/* {automations.reduce((sum, a) => sum + a.runsCount, 0)} */}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {/* {(automations.reduce((sum, a) => sum + a.successRate, 0) / automations.length).toFixed(1)}% */}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Time Saved</p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">24h</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Automations List */}
          {/* The Card component is not defined in the provided file, so it's removed. */}
          {/* <Card className="bg-white dark:bg-gray-800"> */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Automations</h2>
                <button className="btn-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>

              <div className="space-y-4">
                {/* {automations.map((automation) => ( */}
                  <div
                    key={/* automation.id */ 'placeholder'}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getTypeIcon('trigger')}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {/* {automation.name} */}
                            Placeholder Automation
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {/* {automation.type} */}
                            Trigger
                          </p>
                        </div>
                      </div>
                      {getStatusBadge('active')}
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Run</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {/* {automation.lastRun ? new Date(automation.lastRun).toLocaleString() : 'Never'} */}
                          Never
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Next Run</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {/* {automation.nextRun ? new Date(automation.nextRun).toLocaleString() : 'Not scheduled'} */}
                          Not scheduled
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {/* {automation.runsCount} */}
                          0
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {/* {automation.successRate}% */}
                          0%
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-end">
                      <button className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                {/* ))} */}
              </div>
            </div>
          {/* </Card> */}
        </div>
      )}

      {activeTab === 'triggers' && <TriggerEngine />}
      {activeTab === 'playbooks' && <WorkflowPlaybooks />}
      {activeTab === 'reminders' && <IntelligentReminders />}
    </div>
  );
}