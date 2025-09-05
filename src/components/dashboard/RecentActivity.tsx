import { Sparkles, Split, ShoppingBag, ArrowRight } from 'lucide-react';


const activities = [
  {
    id: 1,
    type: 'optimization',
    title: 'Product listing optimized',
    description: 'Wireless Earbuds Pro',
    time: '2 hours ago',
    icon: <Sparkles className="h-5 w-5 text-indigo-500" />,
    path: '/products/1',
  },
  {
    id: 2,
    type: 'ab_test',
    title: 'A/B test started',
    description: 'HD Security Camera',
    time: '4 hours ago',
    icon: <Split className="h-5 w-5 text-amber-500" />,
    path: '/ab-tests/1',
  },
  {
    id: 3,
    type: 'product',
    title: 'New product added',
    description: 'Smart Watch X3',
    time: '1 day ago',
    icon: <ShoppingBag className="h-5 w-5 text-emerald-500" />,
    path: '/products/2',
  },
  {
    id: 4,
    type: 'optimization',
    title: 'Product listing optimized',
    description: 'Bluetooth Speaker',
    time: '2 days ago',
    icon: <Sparkles className="h-5 w-5 text-indigo-500" />,
    path: '/products/3',
  }
];

const RecentActivity = () => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {activity.icon}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">{activity.title}</div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p>{activity.description}</p>
                  </div>
                  <div className="mt-2">
                    <a
                      href={activity.path}
                      className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                    >
                      View details
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;