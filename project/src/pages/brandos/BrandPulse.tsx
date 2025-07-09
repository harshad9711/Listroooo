import React from "react";


export default function BrandPulse() {
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Weekly Brand Pulse</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Weekly performance metrics and brand health insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Calendar className="h-4 w-4 mr-2" />
            Change Date
          </button>
          <button className="btn-primary">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart2 className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Connect your platforms to start tracking brand performance
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                Connect Platforms
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}