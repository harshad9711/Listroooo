import React from "react";


import toast from 'react-hot-toast';

interface ABTest {
  id: string;
  name: string;
  listing_id: string;
  control_variant_id: string;
  test_variant_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  created_at: string;
}

const mockTests: ABTest[] = [
  {
    id: '1',
    name: 'Product Title Test',
    listing_id: '1',
    control_variant_id: 'c1',
    test_variant_id: 't1',
    start_date: '2025-06-01T00:00:00Z',
    end_date: '2025-06-15T00:00:00Z',
    status: 'active',
    created_at: '2025-05-28T10:00:00Z'
  },
  {
    id: '2',
    name: 'Description Length Test',
    listing_id: '2',
    control_variant_id: 'c2',
    test_variant_id: 't2',
    start_date: '2025-06-05T00:00:00Z',
    end_date: '2025-06-19T00:00:00Z',
    status: 'draft',
    created_at: '2025-05-28T11:30:00Z'
  }
];

export default function ABTests() {
  const [tests, setTests] = useState<ABTest[]>(mockTests);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredTests = tests.filter(test => 
    selectedStatus === 'all' || test.status === selectedStatus
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <Play className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <BarChart2 className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Pause className="w-3 h-3 mr-1" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Draft
          </span>
        );
    }
  };

  const handleStatusChange = async (testId: string, newStatus: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-ab-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId,
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update test status');
      }

      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status: newStatus as ABTest['status'] } : test
      ));

      toast.success('Test status updated successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update test status');
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">A/B Tests</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create and manage A/B tests for your listings
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option>All Time</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort By
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option>Created Date</option>
                <option>Start Date</option>
                <option>Status</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredTests.map((test) => (
          <Card key={test.id} className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Split className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {test.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Created {new Date(test.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(test.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(test.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {Math.ceil((new Date(test.end_date).getTime() - new Date(test.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="flex space-x-3">
                  {test.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange(test.id, 'active')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Play className="h-4 w-4 mr-1.5" />
                      Start Test
                    </button>
                  )}
                  {test.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(test.id, 'paused')}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Pause className="h-4 w-4 mr-1.5" />
                      Pause Test
                    </button>
                  )}
                  {test.status === 'paused' && (
                    <button
                      onClick={() => handleStatusChange(test.id, 'active')}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Play className="h-4 w-4 mr-1.5" />
                      Resume Test
                    </button>
                  )}
                </div>
                <button className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  View Details
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <Split className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tests found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first A/B test
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create New Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}