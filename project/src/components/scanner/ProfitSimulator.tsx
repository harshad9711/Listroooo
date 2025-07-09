import React from "react";



interface PlatformFees {
  shopify: number;
  tiktok: number;
}

interface MarketplaceMetrics {
  platform: string;
  revenue: number;
  profit: number;
  margin: number;
  roi: number;
}

const platformFees: PlatformFees = {
  shopify: 0.029,
  tiktok: 0.10
};

export default function ProfitSimulator() {
  const [productCost, setProductCost] = useState<number>(20);
  const [shippingCost, setShippingCost] = useState<number>(5);
  const [targetPrice, setTargetPrice] = useState<number>(49.99);
  const [marketingCost, setMarketingCost] = useState<number>(8);
  const [metrics, setMetrics] = useState<MarketplaceMetrics[]>([]);

  useEffect(() => {
    calculateMetrics();
  }, [productCost, shippingCost, targetPrice, marketingCost]);

  const calculateMetrics = () => {
    const newMetrics = Object.entries(platformFees).map(([platform, fee]) => {
      const revenue = targetPrice;
      const platformFee = revenue * fee;
      const totalCost = productCost + shippingCost + marketingCost + platformFee;
      const profit = revenue - totalCost;
      const margin = (profit / revenue) * 100;
      const roi = (profit / totalCost) * 100;

      return {
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        revenue: parseFloat(revenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
        roi: parseFloat(roi.toFixed(2))
      };
    });

    setMetrics(newMetrics.sort((a, b) => b.profit - a.profit));
  };

  const getBadgeColor = (value: number) => {
    if (value <= 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (value < 15) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    if (value < 30) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Title>Price & Profit Simulator</Title>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            All fees are approximate
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Cost
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={productCost}
                onChange={(e) => setProductCost(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Shipping Cost
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Marketing Cost
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={marketingCost}
                onChange={(e) => setMarketingCost(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mt-6">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.map((metric) => (
                <tr key={metric.platform}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {metric.platform}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ${metric.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(metric.profit)}`}>
                      ${metric.profit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(metric.margin)}`}>
                      {metric.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(metric.roi)}`}>
                      {metric.roi.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center mb-2">
            <Percent className="h-4 w-4 text-gray-400 mr-2" />
            <Text className="font-medium">Platform Fee Breakdown</Text>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text className="text-gray-500 dark:text-gray-400">Shopify</Text>
              <Text className="font-medium">{(platformFees.shopify * 100).toFixed(1)}%</Text>
            </div>
            <div>
              <Text className="text-gray-500 dark:text-gray-400">TikTok Shop</Text>
              <Text className="font-medium">{(platformFees.tiktok * 100).toFixed(1)}%</Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}