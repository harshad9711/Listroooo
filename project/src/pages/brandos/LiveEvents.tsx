import React from "react";



interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  platform: string;
  status: 'scheduled' | 'live' | 'ended';
  participants: number;
  engagement: number;
}

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Summer Collection Launch',
    description: 'Live showcase of our new summer collection with exclusive deals',
    startDate: '2025-06-15T14:00:00Z',
    endDate: '2025-06-15T16:00:00Z',
    platform: 'TikTok Shop',
    status: 'scheduled',
    participants: 0,
    engagement: 0
  },
  {
    id: '2',
    title: 'Q&A with Lead Designer',
    description: 'Interactive Q&A session about our design process',
    startDate: '2025-06-20T18:00:00Z',
    endDate: '2025-06-20T19:30:00Z',
    platform: 'Shopify',
    status: 'scheduled',
    participants: 0,
    engagement: 0
  }
];

export default function LiveEvents() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const filteredEvents = events.filter(event => 
    selectedPlatform === 'all' || event.platform === selectedPlatform
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <Play className="w-3 h-3 mr-1" />
            Live Now
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <Pause className="w-3 h-3 mr-1" />
            Ended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Live Events</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Schedule and manage your live shopping events
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              >
                <option value="all">All Platforms</option>
                <option value="TikTok Shop">TikTok Shop</option>
                <option value="Shopify">Shopify</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option>All Status</option>
                <option>Scheduled</option>
                <option>Live</option>
                <option>Ended</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm">
                <option>Next 7 days</option>
                <option>Next 30 days</option>
                <option>All upcoming</option>
                <option>Past events</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {event.description}
                    </p>
                  </div>
                </div>
                {getStatusBadge(event.status)}
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Platform</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {event.platform}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(event.startDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60))} mins
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expected Participants</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    <Users className="inline h-4 w-4 mr-1" />
                    {event.participants}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  View Details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No events found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating your first live event
                </p>
                <div className="mt-6">
                  <button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    New Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}