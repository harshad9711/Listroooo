import React from 'react';

const VeoStudioTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎬 Veo 3 Cinematic Generator
          </h1>
          <p className="text-gray-600 mb-6">
            Welcome to the Veo 3 Cinematic Generator! This is a test page to verify the routing is working.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Composer</h3>
              <p className="text-blue-700">Transform ideas into structured video prompts</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Template Library</h3>
              <p className="text-green-700">Pre-built video templates for quick starts</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Brand Kits</h3>
              <p className="text-purple-700">Manage brand assets, colors, and fonts</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-green-100 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ Veo 3 Studio is working! The routing is functional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeoStudioTest;
