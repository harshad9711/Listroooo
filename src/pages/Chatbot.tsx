import React, { useState } from 'react';

import {
  Send, 
  Bot, 
  User, 
  Settings, 
  Zap, 
  BarChart2, 
  FileText, 
  TrendingUp,
  DollarSign,
  Slack,
  BookOpen,
  Brain
} from 'lucide-react';
import toast from 'react-hot-toast';

// Temporary Card components - replace with actual UI library imports
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>
);

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  actions?: {
    type: 'metric' | 'workflow' | 'report';
    data?: any;
  }[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'revenue',
    label: 'Q1 Revenue',
    icon: <DollarSign className="h-4 w-4" />,
    prompt: 'Show me Q1 revenue by channel'
  },
  {
    id: 'performance',
    label: 'Campaign Performance',
    icon: <TrendingUp className="h-4 w-4" />,
    prompt: 'Summarize latest campaign performance'
  },
  {
    id: 'report',
    label: 'Monthly Report',
    icon: <FileText className="h-4 w-4" />,
    prompt: 'Start monthly performance report'
  },
  {
    id: 'budget',
    label: 'Budget Status',
    icon: <BarChart2 className="h-4 w-4" />,
    prompt: 'What is our current budget utilization?'
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'bot',
    content: 'Hello! I\'m your AI assistant. I can help you with metrics, reports, and workflows. What would you like to know?',
    timestamp: new Date().toISOString()
  }
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Simulate API call to chatbot service
      await new Promise(resolve => setTimeout(resolve, 1500));

      const botResponse = await generateBotResponse(content);
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      toast.error('Failed to get response from chatbot');
    } finally {
      setIsTyping(false);
    }
  };

  const generateBotResponse = async (userInput: string): Promise<Message> => {
    const input = userInput.toLowerCase();
    
    // Simple response logic - in production this would use AI
    let content = '';
    let actions: Message['actions'] = [];

    if (input.includes('revenue') || input.includes('q1')) {
      content = 'Here\'s your Q1 revenue breakdown:\n\n• Shopify: $45,230 (↑12%)\n• TikTok Shop: $32,150 (↑28%)\n• Amazon: $18,900 (↑5%)\n\nTotal Q1 Revenue: $96,280 (↑15% vs Q1 2024)';
      actions = [{
        type: 'metric',
        data: { metric: 'revenue', period: 'Q1', value: 96280 }
      }];
    } else if (input.includes('campaign') || input.includes('performance')) {
      content = 'Latest campaign performance summary:\n\n📊 **Active Campaigns:** 12\n💰 **Total Spend:** $8,450 (last 7 days)\n📈 **Average ROAS:** 3.2x\n🎯 **Top Performer:** Summer Collection (+45% CTR)\n⚠️ **Needs Attention:** Winter Clearance (1.8x ROAS)';
      actions = [{
        type: 'report',
        data: { type: 'campaign_summary' }
      }];
    } else if (input.includes('report') || input.includes('monthly')) {
      content = 'I\'ll start generating your monthly performance report. This includes:\n\n✅ Revenue analysis\n✅ Campaign performance\n✅ Budget utilization\n✅ Key insights\n\nEstimated completion: 5 minutes. I\'ll notify you when it\'s ready!';
      actions = [{
        type: 'workflow',
        data: { workflow: 'monthly_report' }
      }];
    } else if (input.includes('budget')) {
      content = 'Current budget status:\n\n💰 **Monthly Budget:** $15,000\n📊 **Spent:** $8,450 (56%)\n⏰ **Days Remaining:** 12\n📈 **Projected Spend:** $13,200 (88%)\n\n✅ On track to stay within budget!';
    } else if (input.includes('help') || input.includes('what can you do')) {
      content = 'I can help you with:\n\n📊 **Metrics & Analytics**\n• Revenue reports\n• Campaign performance\n• Budget tracking\n\n🔄 **Workflows**\n• Start monthly reports\n• Trigger automations\n• Schedule tasks\n\n📚 **Knowledge Base**\n• SOPs and procedures\n• Product information\n• Marketing playbooks\n\nJust ask me anything!';
    } else {
      content = 'I understand you\'re asking about "' + userInput + '". Let me help you with that. Could you be more specific about what information you need?';
    }

    return {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date().toISOString(),
      actions
    };
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Get instant answers and trigger workflows with natural language
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            // onClick={() => setShowSettings(true)}
          >
            <Settings className="h-5 w-5" />
          </button>
          <button className="btn-secondary">
            <Slack className="h-4 w-4 mr-2" />
            Connect Slack
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="bg-white dark:bg-gray-800 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Assistant</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">Online</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex space-x-3 max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-indigo-600' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Bot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' 
                          ? 'text-indigo-200' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex space-x-3 max-w-xs lg:max-w-md">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="btn-primary"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Capabilities */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">What I Can Do</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <BarChart2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Fetch Metrics</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get revenue, performance, and analytics data</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Trigger Workflows</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Start reports, automations, and tasks</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <BookOpen className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Knowledge Base</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Answer questions about SOPs and procedures</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Smart Analysis</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Provide insights and recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Example Queries */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Try Asking</h3>
              <div className="space-y-2">
                {[
                  'What\'s our ROAS this month?',
                  'Start the weekly report',
                  'How do I optimize campaigns?',
                  'Show me top performing ads'
                ].map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(query)}
                    className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    "{query}"
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
