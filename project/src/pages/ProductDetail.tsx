import { useParams } from 'react-router-dom';


const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Product Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Product ID: {id}</p>
        {/* Additional product details will be implemented later */}
      </div>
    </div>
  );
};

export default ProductDetail;