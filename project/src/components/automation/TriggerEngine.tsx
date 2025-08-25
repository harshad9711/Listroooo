import { useState } from "react";
import {
  Zap, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users,
  MessageSquare,
  Mail
} from 'lucide-react';

interface Trigger {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: string;
    value: number;
    timeframe: string;
  };
  actions: {
    type: 'email' | 'slack' | 'pause_campaign' | 'webhook';
    target: string;
    message?: string;
  }[];
  status: 'active' | 'paused';
  lastTriggered?: string;
  triggerCount: number;
}

const mockTriggers: Trigger[] = [
  {
    id: '1',
    name: 'High Spend Alert',
    description: 'Alert when daily ad spend exceeds budget threshold',
    condition: {
      metric: 'daily_spend',
      operator: '>',
      value: 500,
      timeframe: 'daily'
    },
    actions: [
      {
        type: 'slack',
        target: '#marketing-alerts',
        message: 'Daily ad spend has exceeded $500. Current spend: {{current_value}}'
      },
      {
        type: 'email',
        target: 'marketing@company.com',
        message: 'High spend alert triggered'
      }
    ],
    status: 'active',
    lastTriggered: '2025-06-06T14:30:00Z',
    triggerCount: 12
  },
  {
    id: '2',
    name: 'Low ROAS Warning',
    description: 'Pause campaigns when ROAS drops below threshold',
    condition: {
      metric: 'roas',
      operator: '<',
      value: 2,
      timeframe: 'hourly'
    },
    actions: [
      {
        type: 'pause_campaign',
        target: 'all_active_campaigns'
      },
      {
        type: 'slack',
        target: '#urgent-alerts',
        message: 'URGENT: Campaigns paused due to low ROAS ({{current_value}})'
      }
    ],
    status: 'active',
    lastTriggered: '2025-06-05T16:45:00Z',
    triggerCount: 3
  }
];

export default function TriggerEngine() {
  const [triggers, setTriggers] = useState(mockTriggers);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleToggleStatus = async (triggerId: string) => {
    try {
      setTriggers(prev => prev.map(trigger => 
        trigger.id === triggerId 
          ? { ...trigger, status: trigger.status === 'active' ? 'paused' : 'active' }
          : trigger
      ));
      alert('Trigger status updated');
    } catch (error) {
      alert('Failed to update trigger status');
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    try {
      setTriggers(prev => prev.filter(trigger => trigger.id !== triggerId));
      alert('Trigger deleted');
    } catch (error) {
      alert('Failed to delete trigger');
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'daily_spend':
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'roas':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'impressions':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'slack':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'pause_campaign':
        return <Pause className="h-4 w-4 text-orange-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trigger Engine</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Define conditions and automated actions for your campaigns
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Trigger
            </button>
          </div>

          <div className="space-y-4">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-indigo-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {trigger.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {trigger.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      trigger.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {trigger.status === 'active' ? (
                        <Play className="w-3 h-3 mr-1" />
                      ) : (
                        <Pause className="w-3 h-3 mr-1" />
                      )}
                      {trigger.status}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(trigger.id)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      {trigger.status === 'active' ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(trigger.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condition</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      {getMetricIcon(trigger.condition.metric)}
                      <span className="capitalize">{trigger.condition.metric.replace('_', ' ')}</span>
                      <span>{trigger.condition.operator}</span>
                      <span>${trigger.condition.value}</span>
                      <span className="text-xs">({trigger.condition.timeframe})</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actions</h4>
                    <div className="space-y-1">
                      {trigger.actions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          {getActionIcon(action.type)}
                          <span className="capitalize">{action.type.replace('_', ' ')}</span>
                          <span>→</span>
                          <span>{action.target}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Triggered {trigger.triggerCount} times</span>
                    {trigger.lastTriggered && (
                      <span>Last: {new Date(trigger.lastTriggered).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Trigger</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Trigger creation coming soon...</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}