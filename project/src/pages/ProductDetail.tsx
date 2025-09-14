import React from 'react';
import { useParams } from 'react-router-dom';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Detail</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Product {id} details coming soon...</p>
      </div>
    </div>
  );
};

export default ProductDetail;


