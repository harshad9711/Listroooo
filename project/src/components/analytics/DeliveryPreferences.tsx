import { useState } from "react";
import { Card, Title, Text } from '@tremor/react';
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Save, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

import toast from 'react-hot-toast';

interface DeliveryPreference {
  type: 'email' | 'slack' | 'in_app';
  enabled: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  events: string[];
}

export default function DeliveryPreferences() {
  const [preferences, setPreferences] = useState<DeliveryPreference[]>([
    {
      type: 'email',
      enabled: true,
      frequency: 'instant',
      events: ['refresh_complete', 'refresh_error', 'performance_alert']
    },
    {
      type: 'slack',
      enabled: true,
      frequency: 'instant',
      events: ['refresh_complete', 'refresh_error']
    },
    {
      type: 'in_app',
      enabled: true,
      frequency: 'instant',
      events: ['refresh_complete', 'refresh_error', 'performance_alert', 'weekly_summary']
    }
  ]);

  const [saving, setSaving] = useState(false);

  const handleToggle = (type: string) => {
    setPreferences(prev => prev.map(pref => 
      pref.type === type ? { ...pref, enabled: !pref.enabled } : pref
    ));
  };

  const handleFrequencyChange = (type: string, frequency: 'instant' | 'daily' | 'weekly') => {
    setPreferences(prev => prev.map(pref => 
      pref.type === type ? { ...pref, frequency } : pref
    ));
  };

  const handleEventToggle = (type: string, event: string) => {
    setPreferences(prev => prev.map(pref => {
      if (pref.type === type) {
        const events = pref.events.includes(event)
          ? pref.events.filter(e => e !== event)
          : [...pref.events, event];
        return { ...pref, events };
      }
      return pref;
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-delivery-preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'slack':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'in_app':
        return <Bell className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getChannelName = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email Notifications';
      case 'slack':
        return 'Slack Notifications';
      case 'in_app':
        return 'In-App Notifications';
      default:
        return type;
    }
  };

  const eventLabels: Record<string, string> = {
    refresh_complete: 'Refresh Complete',
    refresh_error: 'Refresh Errors',
    performance_alert: 'Performance Alerts',
    weekly_summary: 'Weekly Summary'
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Delivery Preferences</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Manage how and when you receive notifications
            </Text>
          </div>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Save className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {preferences.map((pref) => (
            <div
              key={pref.type}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(pref.type)}
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {getChannelName(pref.type)}
                  </h3>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleToggle(pref.type)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      pref.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        pref.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {pref.enabled && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Delivery Frequency
                    </h4>
                    <div className="flex space-x-4">
                      {['instant', 'daily', 'weekly'].map((freq) => (
                        <label
                          key={freq}
                          className="inline-flex items-center"
                        >
                          <input
                            type="radio"
                            name={`frequency-${pref.type}`}
                            value={freq}
                            checked={pref.frequency === freq}
                            onChange={() => handleFrequencyChange(pref.type, freq as 'instant' | 'daily' | 'weekly')}
                            className="form-radio h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {freq}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Event Types
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(eventLabels).map(([event, label]) => (
                        <label
                          key={event}
                          className="inline-flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={pref.events.includes(event)}
                            onChange={() => handleEventToggle(pref.type, event)}
                            className="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}