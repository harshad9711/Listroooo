import React, { useState } from 'react';
import { User, Building2, CreditCard, Store, Bell, ListChecks, Palette, Shield, Search, HelpCircle } from 'lucide-react';

import toast from 'react-hot-toast';

interface SettingsGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  features: SettingsFeature[];
}

interface SettingsFeature {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  comingSoon?: boolean;
}

const settingsGroups: SettingsGroup[] = [
  {
    id: 'account',
    title: 'Account Settings',
    icon: <User className="h-5 w-5" />,
    features: [
      {
        id: 'account-profile',
        title: 'Profile',
        description: 'Update your name and profile picture',
        enabled: true
      },
      {
        id: 'account-contact',
        title: 'Contact Information',
        description: 'Manage your email and phone number',
        enabled: true
      },
      {
        id: 'account-localization',
        title: 'Localization',
        description: 'Set your timezone and preferred language',
        enabled: true
      },
      {
        id: 'account-security',
        title: 'Security',
        description: 'Password, two-factor authentication and sessions',
        enabled: true
      }
    ]
  },
  {
    id: 'organization',
    title: 'Organization',
    icon: <Building2 className="h-5 w-5" />,
    features: [
      {
        id: 'organization-details',
        title: 'Company Details',
        description: 'Update company information and branding',
        enabled: true
      },
      {
        id: 'organization-team',
        title: 'Team Management',
        description: 'Invite team members and manage roles',
        enabled: true
      }
    ]
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    icon: <CreditCard className="h-5 w-5" />,
    features: [
      {
        id: 'billing-current-plan',
        title: 'Current Plan',
        description: 'View your current plan and usage',
        enabled: true
      },
      {
        id: 'billing-change-plan',
        title: 'Change Plan',
        description: 'Upgrade or downgrade your subscription',
        enabled: true
      },
      {
        id: 'billing-payment-method',
        title: 'Payment Methods',
        description: 'Manage your payment methods',
        enabled: true
      },
      {
        id: 'billing-invoices',
        title: 'Invoices',
        description: 'View and download past invoices',
        enabled: true
      },
      {
        id: 'billing-tax',
        title: 'Tax Settings',
        description: 'Manage tax information and billing address',
        enabled: true
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: <Store className="h-5 w-5" />,
    features: [
      {
        id: 'integration-shopify',
        title: 'Shopify',
        description: 'Connect your Shopify store',
        enabled: true
      },
      {
        id: 'integration-tiktok',
        title: 'TikTok Shop',
        description: 'Connect your TikTok Shop account',
        enabled: true
      },
      {
        id: 'integration-amazon',
        title: 'Amazon',
        description: 'Connect your Amazon seller account',
        enabled: false,
        comingSoon: true
      },
      {
        id: 'integration-walmart',
        title: 'Walmart',
        description: 'Connect your Walmart seller account',
        enabled: false,
        comingSoon: true
      },
      {
        id: 'integration-etsy',
        title: 'Etsy',
        description: 'Connect your Etsy shop',
        enabled: false,
        comingSoon: true
      },
      {
        id: 'integration-api',
        title: 'API Access',
        description: 'Manage API keys and access tokens',
        enabled: true
      },
      {
        id: 'integration-webhooks',
        title: 'Webhooks',
        description: 'Configure webhook endpoints and events',
        enabled: true
      },
      {
        id: 'integration-bolt-cli',
        title: 'Bolt CLI',
        description: 'View and manage Bolt CLI settings',
        enabled: true
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <Bell className="h-5 w-5" />,
    features: [
      {
        id: 'notifications-email',
        title: 'Email Notifications',
        description: 'Configure email alert preferences',
        enabled: true
      },
      {
        id: 'notifications-in-app',
        title: 'In-App Notifications',
        description: 'Manage in-app notifications and alerts',
        enabled: true
      },
      {
        id: 'notifications-slack',
        title: 'Slack Integration',
        description: 'Configure Slack workspace notifications',
        enabled: true
      }
    ]
  },
  {
    id: 'defaults',
    title: 'Default Settings',
    icon: <ListChecks className="h-5 w-5" />,
    features: [
      {
        id: 'defaults-ab-testing',
        title: 'A/B Testing',
        description: 'Set default test duration and traffic split',
        enabled: true
      },
      {
        id: 'defaults-analytics',
        title: 'Analytics',
        description: 'Configure default metrics and date ranges',
        enabled: true
      },
      {
        id: 'defaults-listing',
        title: 'Listing Defaults',
        description: 'Set default marketplace preferences',
        enabled: true
      }
    ]
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: <Palette className="h-5 w-5" />,
    features: [
      {
        id: 'appearance-theme',
        title: 'Theme',
        description: 'Customize colors and appearance',
        enabled: true
      },
      {
        id: 'appearance-domain',
        title: 'Custom Domain',
        description: 'Set up and manage custom domain',
        enabled: true
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Privacy & Data',
    icon: <Shield className="h-5 w-5" />,
    features: [
      {
        id: 'privacy-data-export',
        title: 'Data Export',
        description: 'Export your data in CSV/JSON format',
        enabled: true
      },
      {
        id: 'privacy-gdpr',
        title: 'Privacy Requests',
        description: 'Submit GDPR/CCPA data requests',
        enabled: true
      },
      {
        id: 'legal-terms',
        title: 'Terms of Service',
        description: 'View our terms of service and legal agreements',
        enabled: true
      }
    ]
  },
  {
    id: 'support',
    title: 'Help & Support',
    icon: <HelpCircle className="h-5 w-5" />,
    features: [
      {
        id: 'support-help-center',
        title: 'Help Center',
        description: 'Access documentation and tutorials',
        enabled: true
      },
      {
        id: 'support-ticket',
        title: 'Support',
        description: 'Get help from our support team',
        enabled: true
      },
      {
        id: 'support-changelog',
        title: 'Changelog',
        description: 'View recent updates and changes',
        enabled: true
      }
    ]
  }
];

export default function Settings() {
  const [activeGroup, setActiveGroup] = useState(settingsGroups[0].id);
  const [searchTerm, setSearchTerm] = useState('');

  const currentGroup = settingsGroups.find(group => group.id === activeGroup);

  const filteredGroups = settingsGroups.filter(group =>
    group.features.some(feature =>
      feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleFeatureClick = (featureId: string) => {
    if (featureId.includes('coming-soon')) {
      toast.error('This feature is coming soon!');
      return;
    }
    
    // Handle specific feature navigation
    if (featureId === 'legal-terms') {
      window.open('/terms', '_blank');
      return;
    }
    
    // Handle feature navigation
    console.log('Navigate to feature:', featureId);
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search settings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {filteredGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeGroup === group.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`mr-3 ${
                  activeGroup === group.id
                    ? 'text-indigo-500 dark:text-indigo-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {group.icon}
                </span>
                {group.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {currentGroup && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <span className="mr-3 text-gray-500 dark:text-gray-400">
                    {currentGroup.icon}
                  </span>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {currentGroup.title}
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  {currentGroup.features.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => handleFeatureClick(feature.id)}
                      disabled={feature.comingSoon}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        feature.comingSoon
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {feature.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {feature.description}
                          </p>
                        </div>
                        {feature.comingSoon && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}