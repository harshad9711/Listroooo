import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import {
  Download,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUpRight,
  Filter,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import ReportHistory from "../components/analytics/ReportHistory";
import AbandonedRescueEngine from "../components/analytics/AbandonedRescueEngine";
import AdCreativeRefresher from "../components/analytics/AdCreativeRefresher";
import DeliveryPreferences from "../components/analytics/DeliveryPreferences";
import { saveAs } from 'file-saver';
import { useState } from 'react';


export default function Analytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [platform, setPlatform] = useState("all");

  const metrics = {
    totalRevenue: "$21,600",
    revenueGrowth: "+15.3%",
    averageOrderValue: "$85",
    conversionRate: "3.2%",
    totalOrders: "254",
    orderGrowth: "+12.5%",
    totalCustomers: "198",
    customerGrowth: "+8.9%"
  };

  const exportReport = async () => {
    try {
      const csvContent = [
        ["Date", "Impressions", "Clicks", "Conversions", "Revenue"],
        ...[]
      ].map(row => row.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success("Report exported successfully");

    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your performance across platforms
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-select pl-9"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="form-select pl-9"
            >
              <option value="all">All Platforms</option>
              <option value="shopify">Shopify</option>
              <option value="tiktok">TikTok Shop</option>
            </select>
            <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={exportReport}
            className="btn-secondary inline-flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics.totalRevenue}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">{metrics.revenueGrowth}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics.totalOrders}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">{metrics.orderGrowth}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Customers</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics.totalCustomers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">{metrics.customerGrowth}</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{metrics.conversionRate}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">+0.8%</span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Performance Overview</h2>
              <select className="text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="impressions" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#6366f1" />
                <Bar dataKey="orders" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Platform Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[]}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ad Creative Refresher */}
      <div className="mb-6">
        <AdCreativeRefresher />
      </div>

      {/* Abandoned Cart Rescue */}
      <div className="mb-6">
        <AbandonedRescueEngine />
      </div>

      {/* Delivery Preferences */}
      <div className="mb-6">
        <DeliveryPreferences />
      </div>

      {/* Report History */}
      <div className="mt-6">
        <ReportHistory />
      </div>
    </div>
  );
}