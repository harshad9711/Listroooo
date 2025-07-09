import React from "react";
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';


interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, icon }) => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
        <div className="text-sm">
          <div className="flex items-center">
            <div className={`flex items-center ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 mr-1 flex-shrink-0" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1 flex-shrink-0" />
              )}
              <span className="font-medium">{change}</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;