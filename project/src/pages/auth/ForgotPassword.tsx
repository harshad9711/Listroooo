import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Forgot Password</h2>
        <p className="text-gray-600 mb-6">
          Password reset functionality coming soon...
        </p>
        <Link 
          to="/login" 
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;


