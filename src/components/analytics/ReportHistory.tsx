import { useState, useEffect } from "react";
import { 
  Filter, 
  Clock, 
  Mail, 
  Download, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { format } from 'date-fns';

interface Report {
  id: string;
  date: string;
  type: string;
  platform: string;
  recipients: string[];
  downloadUrl: string;
}

const ITEMS_PER_PAGE = 3;

const reportTypes = ['All Types', 'Performance Analytics', 'Conversion Report', 'Optimization Impact', 'Monthly Summary'];
const platforms = ['All Platforms', 'Amazon', 'Shopify', 'TikTok Shop', 'Etsy'];

export default function ReportHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [showFilters, setShowFilters] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/ugc/reports`)
      .then(res => res.json())
      .then(data => setReports(data));
  }, []);
  
  const filteredReports = reports.filter(report => {
    const typeMatch = selectedType === 'All Types' || report.type === selectedType;
    const platformMatch = selectedPlatform === 'All Platforms' || report.platform === selectedPlatform;
    return typeMatch && platformMatch;
  });

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const resetFilters = () => {
    setSelectedType('All Types');
    setSelectedPlatform('All Platforms');
    setCurrentPage(1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report History</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</span>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter Reports</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Reset filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="form-select w-full"
                >
                  {reportTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="form-select w-full"
                >
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {paginatedReports.map((report) => (
          <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{report.type}</h3>
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{report.platform}</span>
                    <span>•</span>
                    <span>{format(new Date(report.date), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Sent to {report.recipients.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                onClick={() => window.open(report.downloadUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            </div>
          </div>
        ))}

        {paginatedReports.length === 0 && (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No reports found matching your filters.
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span>
                {' '}-{' '}
                <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredReports.length)}</span>
                {' '}of{' '}
                <span className="font-medium">{filteredReports.length}</span> reports
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}