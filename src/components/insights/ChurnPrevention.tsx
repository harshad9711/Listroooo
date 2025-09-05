import { useState } from "react";
import { Card, Title } from '@tremor/react';
import { 
  AlertCircle, 
  DollarSign,
  TrendingDown, 
  TrendingUp,
  Send,
  Star,
  Plus,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChurnPrevention() {
  const [loading, setLoading] = useState(false);

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Churn data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Churn Prevention</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Identify at-risk customers and trigger automated retention campaigns
          </p>
        </div>
        <button
          onClick={handleRefreshData}
          disabled={loading}
          className="btn-secondary"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk Customers</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">12</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500 ml-1">+2</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">At-Risk Revenue</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">$2,486</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500 ml-1">-8%</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Campaigns Sent</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">47</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500 ml-1">+15%</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">32%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500 ml-1">+4.2%</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Title>Active Prevention Campaigns</Title>
            <button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </button>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No active campaigns found</p>
            <p className="text-sm">Create your first churn prevention campaign to get started</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
