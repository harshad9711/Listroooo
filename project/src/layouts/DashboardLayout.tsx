import React from 'react';
import { Outlet } from 'react-router-dom';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Listro</h1>
          </div>
          <nav className="mt-6">
            <div className="px-3 space-y-1">
              <a href="/dashboard" className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                Dashboard
              </a>
              <a href="/products" className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                Products
              </a>
              <a href="/analytics" className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                Analytics
              </a>
              <a href="/settings" className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
                Settings
              </a>
            </div>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;


