import React, { useState, useEffect } from 'react';
import { useAiAssistant } from '../contexts/AiAssistantContext';
import { aiAssistantService } from '../services/aiAssistantService';


interface Conversation {
  id: string;
  session_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  created_at: string;
}

interface ModelSettings {
  model: string;
  temperature: number;
  max_tokens: number;
  allowed_actions: string[];
  restricted_actions: string[];
}

const AiAssistant: React.FC = () => {
  const { userId, preferences, memory, recentActions } = useAiAssistant();
  const [activeTab, setActiveTab] = useState('chat');
  const [conversations] = useState<Conversation[]>([]);
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);
  const [integrationLogs] = useState<any[]>([]);
  const [proactiveTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load conversations
      // const convData = await aiAssistantService.getConversations();
      // if (convData) {
      //   // Group by session
      //   const grouped = convData.reduce((acc: any, msg: any) => {
      //     if (!acc[msg.session_id]) {
      //       acc[msg.session_id] = {
      //         id: msg.session_id,
      //         session_id: msg.session_id,
      //         messages: [],
      //         created_at: msg.timestamp
      //       };
      //     }
      //     acc[msg.session_id].messages.push({
      //       role: msg.message_type,
      //       content: msg.content,
      //       timestamp: msg.timestamp
      //     });
      //     return acc;
      //   }, {});
      //   setConversations(Object.values(grouped));
      // }

      // Load model settings
      const settings = await aiAssistantService.getModelSettings();
      setModelSettings(settings);

      // Load integration logs
      // const logsData = await aiAssistantService.getIntegrationLogs();
      // if (logsData) {
      //   setIntegrationLogs(logsData);
      // }

      // Load proactive triggers
      // const triggersData = await aiAssistantService.getProactiveTriggers();
      // if (triggersData) {
      //   setProactiveTriggers(triggersData);
      // }

    } catch (error) {
      console.error('Error loading AI assistant data:', error);
    }
    setLoading(false);
  };

  const updateModelSettings = async (newSettings: Partial<ModelSettings>) => {
    if (!modelSettings) return;
    
    try {
      const updated = { ...modelSettings, ...newSettings };
      const result = await aiAssistantService.updateModelSettings(updated);
      if (result.success) {
        setModelSettings(updated);
      }
    } catch (error) {
      console.error('Error updating model settings:', error);
    }
  };

  const testIntegration = async (action: string, payload: any) => {
    try {
      const result = await aiAssistantService.triggerIntegration(action, { ...payload, userId });
      return result;
    } catch (error: any) {
      console.error('Error testing integration:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Assistant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your AI assistant settings, view conversation history, and monitor integrations
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'chat', label: 'Conversations', icon: '💬' },
              { id: 'settings', label: 'Model Settings', icon: '⚙️' },
              { id: 'integrations', label: 'Integrations', icon: '🔗' },
              { id: 'triggers', label: 'Proactive Triggers', icon: '🔔' },
              { id: 'memory', label: 'Memory & Context', icon: '🧠' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'chat' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Conversation History
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Recent conversations with your AI assistant
                  </p>
                </div>
                <div className="p-6">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">💬</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No conversations yet. Start chatting with your AI assistant!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversations.map(conversation => (
                        <div key={conversation.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Session: {conversation.session_id.slice(0, 8)}...
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTimestamp(conversation.created_at)}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {conversation.messages.slice(0, 3).map((message, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {message.role === 'user' ? 'You' : 'AI'}:
                                </span>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                  {message.content.length > 100 
                                    ? `${message.content.slice(0, 100)}...` 
                                    : message.content
                                  }
                                </span>
                              </div>
                            ))}
                            {conversation.messages.length > 3 && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                +{conversation.messages.length - 3} more messages
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && modelSettings && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Model Settings
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure your AI assistant's behavior and capabilities
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model
                    </label>
                    <select
                      value={modelSettings.model}
                      onChange={(e) => updateModelSettings({ model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3">Claude 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Temperature: {modelSettings.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={modelSettings.temperature}
                      onChange={(e) => updateModelSettings({ temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={modelSettings.max_tokens}
                      onChange={(e) => updateModelSettings({ max_tokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Allowed Actions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {modelSettings.allowed_actions.map(action => (
                        <span key={action} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Restricted Actions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {modelSettings.restricted_actions.map(action => (
                        <span key={action} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Integration Logs
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Recent AI assistant actions and integrations
                  </p>
                </div>
                <div className="p-6">
                  {integrationLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔗</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No integration logs yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {integrationLogs.map(log => (
                        <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.success)}`}>
                                {log.success ? '✅ Success' : '❌ Failed'}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.integration_type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTimestamp(log.timestamp)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Action: {log.action}
                          </div>
                          {log.error_message && (
                            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              Error: {log.error_message}
                            </div>
                          )}
                          {log.execution_time_ms && (
                            <div className="text-xs text-gray-500">
                              Execution time: {log.execution_time_ms}ms
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'triggers' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Proactive Triggers
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Automated recommendations and alerts
                  </p>
                </div>
                <div className="p-6">
                  {proactiveTriggers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔔</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No active triggers configured
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proactiveTriggers.map(trigger => (
                        <div key={trigger.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(trigger.priority)}`}>
                                {trigger.priority.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {trigger.trigger_type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {trigger.action_type}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Condition: {JSON.stringify(trigger.trigger_condition)}
                          </div>
                          {trigger.action_payload && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              Action: {trigger.action_payload.message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Memory & Context
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Your AI assistant's memory and preferences
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      User Preferences
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Theme
                        </label>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {preferences.theme || 'dark'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Language
                        </label>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {preferences.language || 'en'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Recent Actions
                    </h3>
                    <div className="space-y-2">
                      {recentActions.slice(0, 5).map((action, idx) => (
                        <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                          {action.type} - {new Date(action.timestamp).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Frequently Asked
                    </h3>
                    <div className="space-y-2">
                      {memory.frequently_asked?.slice(0, 3).map((question: string, idx: number) => (
                        <div key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                          • {question}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => testIntegration('reorder_inventory', { products: [] })}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  Test Inventory Reorder
                </button>
                <button
                  onClick={() => testIntegration('optimize_campaigns', { performance: {} })}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Test Campaign Optimization
                </button>
                <button
                  onClick={() => testIntegration('create_email_campaign', { templates: [] })}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Test Email Campaign
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Assistant Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversations</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {conversations.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Integration Logs</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {integrationLogs.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Triggers</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {proactiveTriggers.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recent Actions</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {recentActions.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Model Info */}
            {modelSettings && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Model
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {modelSettings.model}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Temperature:</span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {modelSettings.temperature}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Max Tokens:</span>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {modelSettings.max_tokens.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant; 