import { useState, useEffect } from "react";
import {
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  DollarSign,
  TrendingUp,
  Briefcase
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

export default function WorkflowPlaybooks() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/automation/playbooks`)
      .then(res => res.json())
      .then(data => setPlaybooks(data));
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workflow Playbooks</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Pre-built automation workflows for common business processes
              </p>
            </div>
            <button
              onClick={() => {}}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                onClick={() => {}}
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
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    playbook.status === 'active' ? 'bg-green-100 text-green-800' :
                    playbook.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {playbook.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {playbook.description}
                </p>
                <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  {playbook.schedule}
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  Last Run: {playbook.lastRun ? new Date(playbook.lastRun).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  Next Run: {playbook.nextRun ? new Date(playbook.nextRun).toLocaleDateString() : 'N/A'}
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Success Rate: {playbook.successRate}%
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Avg Duration: {playbook.avgDuration}s
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}