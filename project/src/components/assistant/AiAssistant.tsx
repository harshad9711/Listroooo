import React, { useState, useRef, useEffect } from "react";
import { useAiAssistant } from '../../contexts/AiAssistantContext';
import { aiAssistantService } from '../../services/aiAssistantService';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'file' | 'proactive' | 'action';
  data?: any;
  timestamp?: Date;
}

interface ActionButton {
  label: string;
  action: string;
  payload: any;
  variant?: 'primary' | 'secondary' | 'danger';
}

const AiAssistant: React.FC = () => {
  const { userId, preferences, memory, recentActions, addAction } = useAiAssistant();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Hi! I am your AI assistant. I can help you with inventory management, campaign optimization, email marketing, and more. How can I help you today?',
    type: 'text',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showProactive, setShowProactive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load proactive recommendations on mount
  useEffect(() => {
    loadProactiveRecommendations();
  }, []);

  const loadProactiveRecommendations = async () => {
    try {
      const recommendations = await aiAssistantService.getProactiveRecommendations({ 
        userId, 
        preferences, 
        memory, 
        recentActions 
      });
      
      if (recommendations.length > 0 && showProactive) {
        recommendations.forEach((rec: any) => {
          addMessage('assistant', rec.message, 'proactive', rec);
        });
      }
    } catch (error) {
      console.error('Error loading proactive recommendations:', error);
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'proactive' | 'action' = 'text', data?: any) => {
    setMessages(prev => [...prev, {
      role,
      content,
      type,
      data,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!input && !file) return;
    
    setLoading(true);
    const userMessage = input || `Uploaded file: ${file?.name}`;
    addMessage('user', userMessage, 'text', file);
    addAction('ai_message_sent', { input, file });
    
    try {
      let response: any;
      if (file) {
        response = await aiAssistantService.handleMultimodalInput({ text: input, file });
      } else {
        response = await aiAssistantService.retrieveAndGenerate(input, { userId, preferences, memory, recentActions });
      }
      
      addMessage('assistant', response.answer || response.response, 'text', response);
      
      // Add action buttons if available
      if (response.data && response.data.retrievedData) {
        const actionButtons = generateActionButtons(response.data.retrievedData);
        if (actionButtons.length > 0) {
          addMessage('assistant', 'Here are some actions you can take:', 'action', { buttons: actionButtons });
        }
      }
    } catch (error: any) {
      addMessage('assistant', 'I encountered an error. Please try again.', 'text');
    }
    
    setInput('');
    setFile(null);
    setLoading(false);
  };

  const generateActionButtons = (retrievedData: any): ActionButton[] => {
    const buttons: ActionButton[] = [];
    
    if (retrievedData.inventory?.lowStockProducts?.length > 0) {
      buttons.push({
        label: 'Reorder Low Stock',
        action: 'reorder_inventory',
        payload: { products: retrievedData.inventory.lowStockProducts },
        variant: 'primary'
      });
    }
    
    if (retrievedData.campaigns?.adPerformance) {
      buttons.push({
        label: 'Optimize Campaigns',
        action: 'optimize_campaigns',
        payload: { performance: retrievedData.campaigns.adPerformance },
        variant: 'secondary'
      });
    }
    
    if (retrievedData.marketing?.emailTemplates?.length > 0) {
      buttons.push({
        label: 'Create Email Campaign',
        action: 'create_email_campaign',
        payload: { templates: retrievedData.marketing.emailTemplates },
        variant: 'secondary'
      });
    }
    
    return buttons;
  };

  const handleAction = async (action: string, payload: any) => {
    setLoading(true);
    addMessage('user', `Executing: ${action}`, 'action');
    
    try {
      const result = await aiAssistantService.triggerIntegration(action, { ...payload, userId });
      
      if (result.success) {
        addMessage('assistant', `✅ ${result.message || 'Action completed successfully!'}`, 'text', result);
      } else {
        addMessage('assistant', `❌ Error: ${result.error || 'Action failed'}`, 'text', result);
      }
    } catch (error: any) {
      addMessage('assistant', `❌ Error executing action: ${error.message}`, 'text');
    }
    
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-full bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-semibold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowProactive(!showProactive)}
            className="text-white/80 hover:text-white text-xs"
            title={showProactive ? 'Hide proactive suggestions' : 'Show proactive suggestions'}
          >
            {showProactive ? '🔔' : '🔕'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/80 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-[85%] text-sm relative ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : msg.type === 'proactive'
                  ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                  : msg.type === 'action'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}>
              {msg.type === 'file' && msg.data ? (
                <div className="flex items-center space-x-2">
                  <span>📎</span>
                  <span>{msg.data.name}</span>
                </div>
              ) : msg.type === 'image' && msg.data ? (
                <img src={URL.createObjectURL(msg.data)} alt="uploaded" className="max-h-32 rounded" />
              ) : msg.type === 'action' && msg.data?.buttons ? (
                <div className="space-y-2">
                  <div>{msg.content}</div>
                  <div className="flex flex-wrap gap-2">
                    {msg.data.buttons.map((button: ActionButton, btnIdx: number) => (
                      <button
                        key={btnIdx}
                        onClick={() => handleAction(button.action, button.payload)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          button.variant === 'primary'
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : button.variant === 'danger'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>{msg.content}</div>
              )}
              {msg.timestamp && (
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-xl">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ask me anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); }}
            disabled={loading}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={loading}
            title="Attach file"
          >
            📎
          </button>
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            disabled={loading || (!input && !file)}
          >
            Send
          </button>
        </div>
        {file && (
          <div className="mt-2 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <span className="text-xs text-blue-700 dark:text-blue-300">📎 {file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="text-blue-500 hover:text-blue-700 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAssistant; 