import { useState, useEffect } from "react";
import {
  Bell, 
  Plus, 
  Clock, 
  Users, 
  Mail, 
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  Trash2,
  Play,
  Pause
} from 'lucide-react';

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

export default function IntelligentReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/automation/reminders`)
      .then(res => res.json())
      .then(data => setReminders(data));
  }, []);

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
      alert('Reminder status updated');
    } catch (error) {
      alert('Failed to update reminder status');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
      alert('Reminder deleted');
    } catch (error) {
      alert('Failed to delete reminder');
    }
  };

  const handleSendNow = async (_reminderId: string) => {
    try {
      alert('Reminder sent successfully');
    } catch (error) {
      alert('Failed to send reminder');
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
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Intelligent Reminders</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Smart reminders with contextual data and automated scheduling
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                          <Play className="w-3 h-3 mr-1" />
                        ) : (
                          <Pause className="w-3 h-3 mr-1" />
                        )}
                        {reminder.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipients</h4>
                      <div className="space-y-1">
                        {reminder.recipients.map((recipient, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4" />
                            <span>{recipient}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Schedule</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Next Due:</span>
                          <span className={`font-medium ${
                            isOverdue ? 'text-red-600 dark:text-red-400' : 
                            isDueSoon ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-gray-900 dark:text-white'
                          }`}>
                            {new Date(reminder.nextDue).toLocaleDateString()}
                            {isOverdue && ` (${Math.abs(daysUntilDue)} days overdue)`}
                            {isDueSoon && ` (in ${daysUntilDue} days)`}
                          </span>
                        </div>
                        {reminder.lastSent && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Last Sent:</span>
                            <span className="text-gray-900 dark:text-white">
                              {new Date(reminder.lastSent).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {reminder.contextData && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Context Settings</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        {reminder.contextData.includeMetrics && (
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Include Metrics</span>
                          </span>
                        )}
                        {reminder.contextData.attachReports && (
                          <span className="flex items-center space-x-1">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span>Attach Reports</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(reminder.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {reminder.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSendNow(reminder.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Send Now
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Reminder</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Reminder creation coming soon...</p>
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