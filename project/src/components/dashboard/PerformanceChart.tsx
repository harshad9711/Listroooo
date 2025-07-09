// In a real project, we would use a charting library like Chart.js or recharts
// For this mockup, we'll create a simple visual representation
const PerformanceChart = () => {
  // Simulated data
  const data = [
    { date: 'Mon', value: 45 },
    { date: 'Tue', value: 70 },
    { date: 'Wed', value: 65 },
    { date: 'Thu', value: 90 },
    { date: 'Fri', value: 75 },
    { date: 'Sat', value: 80 },
    { date: 'Sun', value: 85 },
  ];

  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="relative">
      <div className="flex items-end justify-between h-40 mt-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center w-full">
            <div 
              className="w-full mx-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-t group relative"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            >
              <div 
                className="absolute inset-0 bg-indigo-500 dark:bg-indigo-400 opacity-50 rounded-t transform-gpu scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom"
              ></div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {item.value}%
              </div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{item.date}</span>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">CTR</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">3.2%</p>
          <p className="text-xs text-green-500 dark:text-green-400">+0.5%</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">2.8%</p>
          <p className="text-xs text-green-500 dark:text-green-400">+0.7%</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">$4,821</p>
          <p className="text-xs text-green-500 dark:text-green-400">+12.5%</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;