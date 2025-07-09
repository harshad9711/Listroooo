import { useState } from "react";
import { Card, Title, Text } from '@tremor/react';
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
import toast from 'react-hot-toast';

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
      toast.success('Trigger status updated');
    } catch (error) {
      toast.error('Failed to update trigger status');
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    try {
      setTriggers(prev => prev.filter(trigger => trigger.id !== triggerId));
      toast.success('Trigger deleted');
    } catch (error) {
      toast.error('Failed to delete trigger');
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
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title>Trigger Engine</Title>
              <Text className="text-gray-500 dark:text-gray-400">
                Define conditions and automated actions for your campaigns
              </Text>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Condition */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Condition
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        {getMetricIcon(trigger.condition.metric)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {trigger.condition.metric.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {trigger.condition.operator}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {trigger.condition.value}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({trigger.condition.timeframe})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Actions ({trigger.actions.length})
                    </h4>
                    <div className="space-y-2">
                      {trigger.actions.map((action, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-2">
                            {getActionIcon(action.type)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {action.type.replace('_', ' ')}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              → {action.target}
                            </span>
                          </div>
                          {action.message && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                              {action.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-500 dark:text-gray-400">
                        Triggered: {trigger.triggerCount} times
                      </span>
                      {trigger.lastTriggered && (
                        <span className="text-gray-500 dark:text-gray-400">
                          Last: {new Date(trigger.lastTriggered).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {triggers.length === 0 && (
              <div className="text-center py-12">
                <Zap className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No triggers configured</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating your first automation trigger
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Trigger
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Trigger
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Define conditions and actions for automated responses
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button className="btn-primary">
                Create Trigger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}