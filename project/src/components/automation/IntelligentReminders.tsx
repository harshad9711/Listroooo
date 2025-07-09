import { useState } from "react";
import { Card, Title, Text } from '@tremor/react';
import {
  Bell, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Mail, 
  MessageSquare,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'budget_review' | 'campaign_check' | 'report_due' | 'meeting' | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  recipients: string[];
  nextDue: string;
  lastSent?: string;
  status: 'active' | 'paused';
  contextData?: {
    includeMetrics: boolean;
    attachReports: boolean;
    customMessage?: string;
  };
}

const mockReminders: Reminder[] = [
  {
    id: '1',
    title: 'Monthly Budget Review',
    description: 'Review monthly ad spend and budget allocation',
    type: 'budget_review',
    frequency: 'monthly',
    recipients: ['finance@company.com', 'marketing@company.com'],
    nextDue: '2025-07-01T09:00:00Z',
    lastSent: '2025-06-01T09:00:00Z',
    status: 'active',
    contextData: {
      includeMetrics: true,
      attachReports: true,
      customMessage: 'Please review the attached budget analysis and provide feedback by EOD.'
    }
  },
  {
    id: '2',
    title: 'Weekly Campaign Performance Check',
    description: 'Review campaign performance and optimization opportunities',
    type: 'campaign_check',
    frequency: 'weekly',
    recipients: ['marketing-team@company.com'],
    nextDue: '2025-06-10T08:00:00Z',
    lastSent: '2025-06-03T08:00:00Z',
    status: 'active',
    contextData: {
      includeMetrics: true,
      attachReports: false
    }
  },
  {
    id: '3',
    title: 'Quarterly Business Review Prep',
    description: 'Prepare materials for quarterly business review meeting',
    type: 'meeting',
    frequency: 'quarterly',
    recipients: ['executives@company.com'],
    nextDue: '2025-07-15T10:00:00Z',
    lastSent: '2025-04-15T10:00:00Z',
    status: 'active',
    contextData: {
      includeMetrics: true,
      attachReports: true,
      customMessage: 'QBR materials are ready for review. Meeting scheduled for next week.'
    }
  }
];

export default function IntelligentReminders() {
  const [reminders, setReminders] = useState(mockReminders);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget_review':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'campaign_check':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'report_due':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'meeting':
        return <Users className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      weekly: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      monthly: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      quarterly: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      custom: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[frequency as keyof typeof colors]}`}>
        <Clock className="w-3 h-3 mr-1" />
        {frequency}
      </span>
    );
  };

  const handleToggleStatus = async (reminderId: string) => {
    try {
      setReminders(prev => prev.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, status: reminder.status === 'active' ? 'paused' : 'active' }
          : reminder
      ));
      toast.success('Reminder status updated');
    } catch (error) {
      toast.error('Failed to update reminder status');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      toast.success('Reminder deleted');
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleSendNow = async (_reminderId: string) => {
    try {
      toast.success('Reminder sent successfully');
    } catch (error) {
      toast.error('Failed to send reminder');
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Title>Intelligent Reminders</Title>
              <Text className="text-gray-500 dark:text-gray-400">
                Smart reminders with contextual data and automated scheduling
              </Text>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Reminder
            </button>
          </div>

          <div className="space-y-4">
            {reminders.map((reminder) => {
              const daysUntilDue = getDaysUntilDue(reminder.nextDue);
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

              return (
                <div
                  key={reminder.id}
                  className={`bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6 border ${
                    isOverdue 
                      ? 'border-red-200 dark:border-red-800' 
                      : isDueSoon 
                      ? 'border-yellow-200 dark:border-yellow-800' 
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(reminder.type)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {reminder.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {reminder.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getFrequencyBadge(reminder.frequency)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reminder.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {reminder.status === 'active' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Pause className="w-3 h-3 mr-1" />
                        )}
                        {reminder.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Schedule & Recipients */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Schedule & Recipients
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Next due: {new Date(reminder.nextDue).toLocaleString()}
                          </span>
                          {isOverdue && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              (Overdue)
                            </span>
                          )}
                          {isDueSoon && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                              (Due soon)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {reminder.recipients.length} recipient(s)
                          </span>
                        </div>
                        {reminder.lastSent && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Last sent: {new Date(reminder.lastSent).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context & Settings */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Context & Settings
                      </h4>
                      <div className="space-y-2">
                        {reminder.contextData?.includeMetrics && (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Include latest metrics
                            </span>
                          </div>
                        )}
                        {reminder.contextData?.attachReports && (
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Attach reports
                            </span>
                          </div>
                        )}
                        {reminder.contextData?.customMessage && (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-4 w-4 text-purple-500 mt-0.5" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Custom message included
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {reminder.contextData?.customMessage && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        "{reminder.contextData.customMessage}"
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Recipients: {reminder.recipients.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSendNow(reminder.id)}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                        >
                          Send Now
                        </button>
                        <button
                          onClick={() => handleToggleStatus(reminder.id)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          {reminder.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {reminders.length === 0 && (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reminders configured</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating your first intelligent reminder
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Reminder
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
              Create New Reminder
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Set up intelligent reminders with contextual data
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button className="btn-primary">
                Create Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}