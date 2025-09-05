import { Filter, Plus, LineChart } from 'lucide-react';


export default function CampaignMemory() {
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Campaign Memory</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Historical campaign performance and insights
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <LineChart className="h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No campaigns yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add your first campaign to start tracking performance
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Campaign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}