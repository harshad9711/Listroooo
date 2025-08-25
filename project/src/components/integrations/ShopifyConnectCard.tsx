import { useState, useEffect } from "react";


import axios from 'axios';

const shopifyLogo = 'https://cdn.shopify.com/assets/images/logos/shopify-bag.png'; // Or use a local asset

export default function ShopifyConnectCard() {
  const [shop, setShop] = useState('');
  const [connected, setConnected] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<'products' | 'orders' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/shopify/store');
      setStoreInfo(res.data);
      setConnected(true);
    } catch {
      setConnected(false);
      setStoreInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const connectShopify = () => {
    if (!shop || !shop.endsWith('.myshopify.com')) {
      setError('Please enter a valid Shopify store domain.');
      return;
    }
    setError(null);
    window.location.href = `/api/shopify/auth?shop=${shop}`;
  };

  const fetchProducts = async () => {
    setSyncing('products');
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.get('/api/shopify/products');
      setProducts(res.data);
      setSuccess('Products synced successfully!');
    } catch {
      setError('Failed to sync products.');
    } finally {
      setSyncing(null);
    }
  };

  const fetchOrders = async () => {
    setSyncing('orders');
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.get('/api/shopify/orders');
      setOrders(res.data);
      setSuccess('Orders synced successfully!');
    } catch {
      setError('Failed to sync orders.');
    } finally {
      setSyncing(null);
    }
  };

  const disconnectShopify = () => {
    // For demo: just clear state. In production, also revoke token on backend.
    setConnected(false);
    setStoreInfo(null);
    setProducts([]);
    setOrders([]);
    setSuccess('Disconnected from Shopify.');
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mt-8 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center mb-4">
        <img src={shopifyLogo} alt="Shopify" className="h-10 w-10 mr-3 rounded" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect your Shopify Store</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sync products and orders with Listro</p>
        </div>
      </div>
      {error && <div className="bg-red-100 text-red-700 px-3 py-2 rounded mb-2">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-3 py-2 rounded mb-2">{success}</div>}
      {loading ? (
        <div className="text-center py-8">Checking connection...</div>
      ) : !connected ? (
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Shopify Store Domain</label>
          <input
            type="text"
            className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your-store.myshopify.com"
            value={shop}
            onChange={e => setShop(e.target.value)}
            autoFocus
          />
          <button
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
            onClick={connectShopify}
          >
            Connect Shopify
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">Connected</span>
              <span className="text-gray-700 dark:text-gray-300 font-semibold">{storeInfo?.name}</span>
            </div>
            <button
              className="text-xs text-red-500 hover:underline"
              onClick={disconnectShopify}
            >
              Disconnect
            </button>
          </div>
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <div>Domain: <span className="font-mono">{storeInfo?.domain}</span></div>
            <div>Email: {storeInfo?.email}</div>
            <div>Plan: {storeInfo?.plan_display_name}</div>
          </div>
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center ${syncing === 'products' ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={fetchProducts}
              disabled={syncing === 'products'}
            >
              {syncing === 'products' ? (
                <span className="loader mr-2"></span>
              ) : null}
              Sync Products
            </button>
            <button
              className={`flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center ${syncing === 'orders' ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={fetchOrders}
              disabled={syncing === 'orders'}
            >
              {syncing === 'orders' ? (
                <span className="loader mr-2"></span>
              ) : null}
              Sync Orders
            </button>
          </div>
          <div className="mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Products</h3>
            <div className="max-h-32 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs">
              {products.length === 0 ? <span className="text-gray-400">No products loaded.</span> : (
                <ul>
                  {products.map(p => (
                    <li key={p.id}>{p.title}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Orders</h3>
            <div className="max-h-32 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-800 p-2 text-xs">
              {orders.length === 0 ? <span className="text-gray-400">No orders loaded.</span> : (
                <ul>
                  {orders.map(o => (
                    <li key={o.id}>Order #{o.id} - {o.email}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Simple loader spinner style */}
      <style>{`
        .loader {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 