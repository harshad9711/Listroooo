import React from "react";


const ABTestDetail = () => {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">A/B Test Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Viewing A/B Test ID: {id}</p>
        {/* Additional test details will be implemented here */}
      </div>
    </div>
  );
};

export default ABTestDetail;