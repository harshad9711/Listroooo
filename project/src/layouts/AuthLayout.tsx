import { Navigate, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthLayout = () => {
  const { user } = useAuth();
  
  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Sparkles className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Listro.co
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          AI-powered e-commerce listing optimization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;