import React, { useState } from 'react';
import { 
  Mail, 
  BarChart2, 
  Sparkles, 
  RefreshCw,
  Users
} from 'lucide-react';

const EmailSmsGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'templates' | 'campaigns' | 'segments'>('generator');
  const [form, setForm] = useState({
    type: 'email',
    category: 'welcome',
    brandName: '',
    productName: '',
    productPrice: '',
    customPrompt: ''
  });
  
  const [generatedContent, setGeneratedContent] = useState<{
    subject?: string;
    content: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!form.brandName) {
      alert('Please enter your brand name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/email-sms/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to generate content');
      const data = await res.json();
      setGeneratedContent(data);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Email & SMS Generator</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Create engaging email and SMS campaigns with AI assistance
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'generator', name: 'Generator', icon: <Sparkles className="h-4 w-4" /> },
            { id: 'templates', name: 'Templates', icon: <Mail className="h-4 w-4" /> },
            { id: 'campaigns', name: 'Campaigns', icon: <BarChart2 className="h-4 w-4" /> },
            { id: 'segments', name: 'Segments', icon: <Users className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Generate Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="email"
                      checked={form.type === 'email'}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="sms"
                      checked={form.type === 'sms'}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SMS</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="welcome">Welcome Series</option>
                  <option value="abandoned_cart">Abandoned Cart Recovery</option>
                  <option value="reengagement">Customer Re-engagement</option>
                  <option value="new_drop">New Product Drops</option>
                  <option value="holiday_sale">Holiday Sales</option>
                  <option value="back_in_stock">Back in Stock</option>
                  <option value="order_confirmation">Order Confirmation</option>
                  <option value="shipping_update">Shipping Update</option>
                  <option value="review_request">Review Request</option>
                  <option value="loyalty_reward">Loyalty Reward</option>
                  <option value="flash_sale">Flash Sale</option>
                  <option value="product_recommendation">Product Recommendation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  placeholder="Enter your brand name"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name (Optional)
                </label>
                  <input
                    type="text"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  placeholder="Enter product name"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Price (Optional)
                </label>
                <input
                  type="text"
                  value={form.productPrice}
                  onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
                  placeholder="Enter product price"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={form.customPrompt}
                  onChange={(e) => setForm({ ...form, customPrompt: e.target.value })}
                  placeholder="Add any specific instructions or requirements..."
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !form.brandName}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="-ml-1 mr-2 h-4 w-4" />
                    Generate {form.type === 'email' ? 'Email' : 'SMS'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Content */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generated Content</h3>
              {generatedContent && (
                  <button
                  onClick={() => copyToClipboard(generatedContent.content)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                  <Mail className="h-4 w-4 mr-1" />
                    Copy
                  </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Generating your content...</p>
                </div>
              </div>
            ) : generatedContent ? (
              <div className="space-y-4">
                {form.type === 'email' && generatedContent.subject && (
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subject Line
                      </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100">
                      {generatedContent.subject}
                      </div>
                    </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {form.type === 'email' ? 'Email Content' : 'SMS Content'}
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {generatedContent.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2" />
                  <p>Generated content will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Email & SMS Templates</h3>
          <p className="text-gray-500 dark:text-gray-400">Template management coming soon...</p>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Campaign Management</h3>
          <p className="text-gray-500 dark:text-gray-400">Campaign management coming soon...</p>
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Segments</h3>
          <p className="text-gray-500 dark:text-gray-400">Customer segmentation coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default EmailSmsGenerator; 