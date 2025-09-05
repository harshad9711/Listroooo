import { useState } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { 
  ShoppingCart, 
  Mail, 
  Filter, 
  Download, 
  Settings, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  BarChart2,
  AlertCircle,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AbandonedCart {
  id: string;
  customer: {
    email: string;
    name: string;
    lastSeen: string;
  };
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  totalValue: number;
  abandonedAt: string;
  platform: string;
  status: 'pending' | 'recovered' | 'lost';
  recoveryAttempts: number;
}

const mockCarts: AbandonedCart[] = [
  {
    id: '1',
    customer: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      lastSeen: '2025-05-06T14:30:00Z'
    },
    items: [
      { name: 'Wireless Earbuds Pro', price: 149.99, quantity: 1 },
      { name: 'Charging Case', price: 29.99, quantity: 1 }
    ],
    totalValue: 179.98,
    abandonedAt: '2025-05-06T14:25:00Z',
    platform: 'Shopify',
    status: 'pending',
    recoveryAttempts: 0
  },
  {
    id: '2',
    customer: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      lastSeen: '2025-05-06T13:15:00Z'
    },
    items: [
      { name: 'HD Security Camera', price: 199.99, quantity: 1 }
    ],
    totalValue: 199.99,
    abandonedAt: '2025-05-06T13:10:00Z',
    platform: 'Amazon',
    status: 'recovered',
    recoveryAttempts: 1
  }
];

export default function AbandonedRescueEngine() {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const filteredCarts = mockCarts.filter(cart => {
    const platformMatch = selectedPlatform === 'all' || cart.platform.toLowerCase() === selectedPlatform.toLowerCase();
    const statusMatch = selectedStatus === 'all' || cart.status === selectedStatus;
    return platformMatch && statusMatch;
  });

  const metrics = {
    totalValue: filteredCarts.reduce((sum, cart) => sum + cart.totalValue, 0),
    totalCarts: filteredCarts.length,
    recoveryRate: (filteredCarts.filter(cart => cart.status === 'recovered').length / filteredCarts.length) * 100 || 0,
    averageValue: filteredCarts.reduce((sum, cart) => sum + cart.totalValue, 0) / filteredCarts.length || 0
  };

  const sendRecoveryEmail = async (cartId: string) => {
    setSending(cartId);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartId,
          type: 'abandoned_cart_recovery'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send recovery email');
      }

      toast.success('Recovery email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send recovery email');
    } finally {
      setSending(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recovered':
        return 'text-green-600 dark:text-green-400';
      case 'lost':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recovered':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'lost':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Abandoned Cart Rescue</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Recover potentially lost sales with smart automation
            </Text>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="btn-secondary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-indigo-500 mr-2" />
                <Text>Total Carts</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {metrics.totalCarts}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart2 className="h-5 w-5 text-green-500 mr-2" />
                <Text>Recovery Rate</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {metrics.recoveryRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-500 mr-2" />
                <Text>Recovery Emails</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              {mockCarts.reduce((sum, cart) => sum + cart.recoveryAttempts, 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-purple-500 mr-2" />
                <Text>Potential Revenue</Text>
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-semibold mt-2">
              ${metrics.totalValue.toFixed(2)}
            </p>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Platforms</option>
                  <option value="shopify">Shopify</option>
                  <option value="amazon">Amazon</option>
                  <option value="walmart">Walmart</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="recovered">Recovered</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Range
                </label>
                <select className="form-select">
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredCarts.map((cart) => (
            <div
              key={cart.id}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center ${getStatusColor(cart.status)}`}>
                    {getStatusIcon(cart.status)}
                    <span className="ml-2 text-sm font-medium capitalize">
                      {cart.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(cart.abandonedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${cart.totalValue.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {cart.platform}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {cart.customer.name}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {cart.customer.email}
                  </span>
                </div>

                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cart Items
                  </h4>
                  <div className="mt-1 space-y-1">
                    {cart.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Recovery attempts: {cart.recoveryAttempts}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Last seen: {new Date(cart.customer.lastSeen).toLocaleString()}
                    </span>
                  </div>
                  {cart.status === 'pending' && (
                    <button
                      onClick={() => sendRecoveryEmail(cart.id)}
                      disabled={sending === cart.id}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending === cart.id ? (
                        <>
                          <Send className="animate-pulse h-4 w-4 mr-1.5" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-1.5" />
                          Send Recovery Email
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredCarts.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No abandoned carts</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No abandoned carts found matching your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}