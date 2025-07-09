import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Sparkles,
  Split,
  LineChart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Store,
  Facebook,
  GitBranch,
  BrainCog,
  Send,
  Zap,
  MessageSquare,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adAccountsOpen, setAdAccountsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Products', path: '/products', icon: <ShoppingBag size={20} /> },
    { name: 'AI Optimizer', path: '/optimize', icon: <Sparkles size={20} /> },
    { name: 'Marketing', path: '/marketing', icon: <Send size={20} /> },
    { name: 'Email & SMS Generator', path: '/email-sms-generator', icon: <Mail size={20} /> },
    { name: 'Ad Performance', path: '/ad-performance', icon: <LineChart size={20} /> },
    { name: 'Automation', path: '/automation', icon: <Zap size={20} /> },
    { name: 'AI Assistant', path: '/chatbot', icon: <MessageSquare size={20} /> },
    { name: 'Market Intelligence', path: '/competitor-scanner', icon: <Split size={20} /> },
    { name: 'Platform Integrations', path: '/platform-integrations', icon: <Store size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <LineChart size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const adPlatforms = [
    { name: 'Meta Ads', icon: <Facebook size={16} className="text-[#1877F2]" /> },
    { name: 'TikTok Ads', icon: <GitBranch size={16} className="text-black dark:text-white" /> },
    { name: 'Google Ads', icon: <BrainCog size={16} className="text-[#4285F4]" /> },
  ];
  
  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700">
          <Link to="/dashboard" className="flex items-center">
            <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">Listro.co</span>
          </Link>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <nav className="mt-6 px-4">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  isCurrentPath(item.path)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className={`${isCurrentPath(item.path) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Ad Accounts Section */}
          <div className="mt-8">
            <div className="px-3">
              <button
                onClick={() => setAdAccountsOpen(!adAccountsOpen)}
                className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <div className="flex items-center">
                  <Store className="h-5 w-5 mr-2" />
                  <span>Ad Accounts</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform duration-200 ${
                    adAccountsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
            {adAccountsOpen && (
              <div className="mt-2 space-y-1">
                {adPlatforms.map((platform) => (
                  <Link
                    key={platform.name}
                    to="/integrations"
                    className="flex items-center px-8 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {platform.icon}
                    <span className="ml-2">{platform.name}</span>
                  </Link>
                ))}
                <Link
                  to="/integrations"
                  className="flex items-center px-8 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  + Connect new account
                </Link>
              </div>
            )}
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full border-t dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center px-6 py-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
          >
            <LogOut size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="ml-3">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center lg:hidden">
              <button onClick={toggleSidebar}>
                <Menu size={24} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full lg:max-w-xs">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent sm:text-sm"
                    placeholder="Search products..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Notifications */}
              <button className="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                <Bell size={20} />
              </button>
              
              {/* Theme toggle */}
              <div className="ml-4 relative">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                >
                  {isDark ? (
                    <svg xmlns="http://www.w3.org/2000/svg\" className="h-5 w-5\" viewBox="0 0 20 20\" fill="currentColor">
                      <path fillRule="evenodd\" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z\" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* User dropdown */}
              <div className="ml-4 relative">
                <div>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user?.avatar || 'https://i.pravatar.cc/150?img=68'}
                      alt={user?.name || 'User'}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                      {user?.name || 'User'}
                    </span>
                    <ChevronDown size={16} className="ml-1 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                
                {userMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
                    onBlur={() => setUserMenuOpen(false)}
                  >
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/integrations"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Integrations
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}