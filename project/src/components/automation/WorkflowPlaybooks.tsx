import { useState } from "react";
import { Card, Title, Text } from '@tremor/react';
import {
  FileText, 
  Plus, 
  Play, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Mail,
  FileSpreadsheet,
  Briefcase,
  Target,
  Settings
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'data_pull' | 'analysis' | 'notification' | 'action';
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'marketing' | 'product';
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'draft';
  steps: WorkflowStep[];
  successRate: number;
  avgDuration: number;
}

const mockPlaybooks: Playbook[] = [
  {
    id: '1',
    name: 'Monthly Financial Close',
    description: 'Automated monthly financial reporting and analysis',
    category: 'financial',
    schedule: 'Monthly on 1st at 9:00 AM',
    lastRun: '2025-06-01T09:00:00Z',
    nextRun: '2025-07-01T09:00:00Z',
    status: 'active',
    successRate: 100,
    avgDuration: 45,
    steps: [
      { id: '1', name: 'Pull Revenue Data', type: 'data_pull', status: 'completed', duration: 5 },
      { id: '2', name: 'Compare to Forecast', type: 'analysis', status: 'completed', duration: 10 },
      { id: '3', name: 'Generate Summary PDF', type: 'action', status: 'completed', duration: 15 },
      { id: '4', name: 'Email CFO', type: 'notification', status: 'completed', duration: 2 }
    ]
  },
  {
    id: '2',
    name: 'Quarterly Product Launch',
    description: 'End-to-end product launch workflow automation',
    category: 'product',
    schedule: 'Quarterly on 15th at 10:00 AM',
    lastRun: '2025-04-15T10:00:00Z',
    nextRun: '2025-07-15T10:00:00Z',
    status: 'active',
    successRate: 95,
    avgDuration: 120,
    steps: [
      { id: '1', name: 'Generate Creative Brief', type: 'action', status: 'completed', duration: 20 },
      { id: '2', name: 'Assign Design Tasks', type: 'action', status: 'completed', duration: 5 },
      { id: '3', name: 'Schedule Email Blasts', type: 'action', status: 'completed', duration: 10 },
      { id: '4', name: 'Generate Ad Copy', type: 'action', status: 'completed', duration: 30 },
      { id: '5', name: 'Notify Stakeholders', type: 'notification', status: 'completed', duration: 5 }
    ]
  },
  {
    id: '3',
    name: 'Weekly Performance Review',
    description: 'Automated weekly campaign performance analysis',
    category: 'marketing',
    schedule: 'Weekly on Monday at 8:00 AM',
    lastRun: '2025-06-03T08:00:00Z',
    nextRun: '2025-06-10T08:00:00Z',
    status: 'active',
    successRate: 98,
    avgDuration: 25,
    steps: [
      { id: '1', name: 'Collect Campaign Data', type: 'data_pull', status: 'completed', duration: 8 },
      { id: '2', name: 'Analyze Performance', type: 'analysis', status: 'completed', duration: 12 },
      { id: '3', name: 'Generate Insights', type: 'analysis', status: 'completed', duration: 10 },
      { id: '4', name: 'Send Report', type: 'notification', status: 'completed', duration: 3 }
    ]
  }
];

export default function WorkflowPlaybooks() {
  const [playbooks] = useState(mockPlaybooks);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'marketing':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'product':
        return <Briefcase className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'data_pull':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      case 'analysis':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'notification':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'action':
        return <Target className="h-4 w-4 text-orange-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title>Workflow Playbooks</Title>
              <Text className="text-gray-500 dark:text-gray-400">
                Pre-built automation workflows for common business processes
              </Text>
            </div>
            <button
              onClick={() => setSelectedPlaybook(null)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Playbook
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {playbooks.map((playbook) => (
              <div
                key={playbook.id}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPlaybook(playbook)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(playbook.category)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {playbook.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {playbook.category}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    playbook.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : playbook.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {playbook.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {playbook.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Schedule:</span>
                    <span className="text-gray-900 dark:text-white">{playbook.schedule}</span>
                  </div>
                  
                  {playbook.nextRun && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(playbook.nextRun).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {playbook.successRate}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Avg Duration:</span>
                    <span className="text-gray-900 dark:text-white">
                      {playbook.avgDuration}m
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {playbook.steps.length} steps
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {playbooks.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No playbooks configured</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first workflow playbook
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setSelectedPlaybook(null)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Playbook
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Playbook Detail Modal */}
      {selectedPlaybook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                {getCategoryIcon(selectedPlaybook.category)}
                <div>
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                    {selectedPlaybook.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPlaybook.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlaybook(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPlaybook.schedule}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success Rate</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPlaybook.successRate}%</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Duration</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{selectedPlaybook.avgDuration} minutes</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workflow Steps</h3>
              <div className="space-y-3">
                {selectedPlaybook.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getStepIcon(step.type)}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {step.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {step.type.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(step.status)}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {step.duration}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedPlaybook(null)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {}}
                className="btn-primary"
              >
                <Play className="h-4 w-4 mr-2" />
                Run Playbook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}