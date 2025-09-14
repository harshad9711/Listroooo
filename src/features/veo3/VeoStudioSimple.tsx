import React, { useState } from 'react';

const VeoStudioSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState('compose');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🎬 Veo 3 Cinematic Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Production Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'compose', label: 'AI Composer', icon: '✨' },
              { id: 'templates', label: 'Templates', icon: '📚' },
              { id: 'brands', label: 'Brand Kits', icon: '🎨' },
              { id: 'variations', label: 'Variations', icon: '🔄' },
              { id: 'catalog', label: 'Catalog', icon: '🛍️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'compose' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">✨ AI Idea → JSON Composer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Idea
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe your video idea... e.g., 'A dynamic product showcase for our new wireless headphones with upbeat music'"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                      <option>Product Awareness</option>
                      <option>Brand Storytelling</option>
                      <option>User Education</option>
                      <option>Social Engagement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                      <option>TikTok (9:16)</option>
                      <option>Instagram Reels (9:16)</option>
                      <option>YouTube Shorts (9:16)</option>
                      <option>Facebook (1:1)</option>
                    </select>
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  🚀 Compose Video Prompt
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📚 Template Library</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Product Showcase', category: 'E-commerce', duration: '8s' },
                  { name: 'Brand Story', category: 'Storytelling', duration: '8s' },
                  { name: 'How-to Tutorial', category: 'Education', duration: '8s' },
                  { name: 'Behind Scenes', category: 'Authentic', duration: '8s' },
                  { name: 'User Testimonial', category: 'Social Proof', duration: '8s' },
                  { name: 'Trending Style', category: 'Viral', duration: '8s' }
                ].map((template, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <span className="text-gray-400">📹</span>
                    </div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.category} • {template.duration}</p>
                    <button className="mt-2 w-full bg-gray-100 hover:bg-gray-200 py-2 px-3 rounded text-sm transition-colors">
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🎨 Brand Kits</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Tech Startup', colors: ['#3B82F6', '#1E40AF', '#FFFFFF'] },
                    { name: 'Fashion Brand', colors: ['#EC4899', '#BE185D', '#F3F4F6'] },
                    { name: 'Eco Friendly', colors: ['#10B981', '#059669', '#F0FDF4'] }
                  ].map((kit, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium mb-3">{kit.name}</h3>
                      <div className="flex space-x-2 mb-3">
                        {kit.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <button className="w-full bg-gray-100 hover:bg-gray-200 py-2 px-3 rounded text-sm transition-colors">
                        Use Brand Kit
                      </button>
                    </div>
                  ))}
                </div>
                <button className="w-full border-2 border-dashed border-gray-300 rounded-lg py-6 text-gray-500 hover:border-gray-400 transition-colors">
                  + Create New Brand Kit
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🔄 Variation Engine</h2>
              <div className="space-y-4">
                <p className="text-gray-600">Generate multiple variations of your video with different styles, colors, and effects.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Style Variations</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Modern Minimalist
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Vintage Retro
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Bold & Dynamic
                      </label>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-2">Color Variations</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        Brand Colors
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Complementary
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Monochrome
                      </label>
                    </div>
                  </div>
                </div>
                <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors">
                  🎨 Generate Variations
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🛍️ Product Catalog</h2>
              <div className="space-y-4">
                <p className="text-gray-600">Connect your Shopify store to automatically generate video content for your products.</p>
                <div className="border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">🛒</div>
                  <h3 className="text-lg font-medium mb-2">Connect Your Store</h3>
                  <p className="text-gray-500 mb-4">Sync your products and automatically create video content</p>
                  <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                    Connect Shopify
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-800 font-medium">Veo 3 Studio Active</span>
        </div>
      </div>
    </div>
  );
};

export default VeoStudioSimple;
