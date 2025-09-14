import React from 'react';

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Basic</h3>
            <p className="text-gray-600">Perfect for getting started</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pro</h3>
            <p className="text-gray-600">For growing businesses</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
            <p className="text-gray-600">For large organizations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

