/**
 * Governance Settings Component
 * Handles GDPR export/delete and data retention settings
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, ProgressBar } from '@tremor/react';
import { 
  Download, 
  Trash2, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface GovernanceSettingsProps {
  userId: string;
  orgId: string;
  userRole: string;
}

interface ExportRequest {
  id: string;
  export_token: string;
  status: string;
  expires_at: string;
  created_at: string;
  file_url?: string;
}

interface DeletionRequest {
  id: string;
  scope: string;
  status: string;
  jobs_deleted: number;
  assets_deleted: number;
  created_at: string;
  completed_at?: string;
}

export default function GovernanceSettings({
  userId,
  orgId,
  userRole
}: GovernanceSettingsProps) {
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [deletions, setDeletions] = useState<DeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing requests
  useEffect(() => {
    loadExports();
    loadDeletions();
  }, []);

  const loadExports = async () => {
    try {
      const response = await fetch('/api/governance/exports');
      const data = await response.json();
      if (data.success) {
        setExports(data.data);
      }
    } catch (error) {
      console.error('Failed to load exports:', error);
    }
  };

  const loadDeletions = async () => {
    try {
      const response = await fetch('/api/governance/deletions');
      const data = await response.json();
      if (data.success) {
        setDeletions(data.data);
      }
    } catch (error) {
      console.error('Failed to load deletions:', error);
    }
  };

  const handleExport = async (scope: 'user' | 'org') => {
    if (!confirm(`Are you sure you want to export all ${scope} data? This will create a downloadable package.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/governance/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope,
          confirm: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Export request created successfully. Token: ${data.data.exportToken}`);
        loadExports();
      } else {
        setError(data.error || 'Export request failed');
      }
    } catch (error) {
      setError('Failed to create export request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (scope: 'user' | 'org') => {
    const scopeText = scope === 'user' ? 'your personal' : 'all organization';
    if (!confirm(`⚠️ WARNING: This will permanently delete ${scopeText} data. This action cannot be undone. Are you absolutely sure?`)) {
      return;
    }

    if (!confirm(`Final confirmation: Delete ALL ${scopeText} data permanently?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/governance/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope,
          confirm: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Deletion request created successfully');
        loadDeletions();
      } else {
        setError(data.error || 'Deletion request failed');
      }
    } catch (error) {
      setError('Failed to create deletion request');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExport = async (exportToken: string) => {
    try {
      const response = await fetch(`/api/governance/gdpr/export/${exportToken}`);
      const data = await response.json();

      if (data.success && data.data.file_url) {
        window.open(data.data.file_url, '_blank');
      } else {
        setError('Export not ready or expired');
      }
    } catch (error) {
      setError('Failed to download export');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'pending':
      case 'processing':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Data Governance</h2>
        </div>
        <p className="text-gray-600">
          Manage your data export and deletion requests in compliance with GDPR regulations.
        </p>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert color="red">
          <AlertTriangle className="w-4 h-4" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {success && (
        <Alert color="green">
          <CheckCircle className="w-4 h-4" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        </Alert>
      )}

      {/* Data Export */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Download className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Data Export</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Request a complete export of your data in a downloadable format.
        </p>

        <div className="flex space-x-2 mb-4">
          <Button
            onClick={() => handleExport('user')}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export My Data</span>
          </Button>
          
          {userRole === 'owner' && (
            <Button
              onClick={() => handleExport('org')}
              disabled={isLoading}
              variant="light"
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export Org Data</span>
            </Button>
          )}
        </div>

        {/* Export History */}
        {exports.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Export History</h4>
            {exports.map((exportReq) => (
              <div key={exportReq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(exportReq.status)}
                  <div>
                    <p className="font-medium">
                      {exportReq.scope === 'user' ? 'Personal Data' : 'Organization Data'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(exportReq.created_at)}
                    </p>
                    {exportReq.expires_at && (
                      <p className="text-sm text-gray-600">
                        Expires: {formatDate(exportReq.expires_at)}
                        {isExpired(exportReq.expires_at) && (
                          <span className="text-red-500 ml-1">(Expired)</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge color={getStatusColor(exportReq.status) as any}>
                    {exportReq.status}
                  </Badge>
                  
                  {exportReq.status === 'completed' && !isExpired(exportReq.expires_at) && (
                    <Button
                      size="sm"
                      onClick={() => downloadExport(exportReq.export_token)}
                    >
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Data Deletion */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">Data Deletion</h3>
        </div>
        
        <Alert color="red" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <div>
            <p className="font-medium">Warning</p>
            <p className="text-sm">
              Data deletion is permanent and cannot be undone. All videos, metadata, and associated files will be permanently removed.
            </p>
          </div>
        </Alert>

        <div className="flex space-x-2 mb-4">
          <Button
            onClick={() => handleDelete('user')}
            disabled={isLoading}
            color="red"
            className="flex items-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Data</span>
          </Button>
          
          {userRole === 'owner' && (
            <Button
              onClick={() => handleDelete('org')}
              disabled={isLoading}
              color="red"
              variant="light"
              className="flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Org Data</span>
            </Button>
          )}
        </div>

        {/* Deletion History */}
        {deletions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Deletion History</h4>
            {deletions.map((deletion) => (
              <div key={deletion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(deletion.status)}
                  <div>
                    <p className="font-medium">
                      {deletion.scope === 'user' ? 'Personal Data' : 'Organization Data'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Created: {formatDate(deletion.created_at)}
                    </p>
                    {deletion.status === 'completed' && (
                      <p className="text-sm text-gray-600">
                        Deleted: {deletion.jobs_deleted} jobs, {deletion.assets_deleted} assets
                      </p>
                    )}
                  </div>
                </div>
                
                <Badge color={getStatusColor(deletion.status) as any}>
                  {deletion.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Data Retention Info */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Data Retention</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Job Retention Period</span>
            <span>90 days</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Export Validity</span>
            <span>30 minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Archived Jobs</span>
            <span>Automatically cleaned up</span>
          </div>
        </div>
        
        <Alert color="blue" className="mt-4">
          <Clock className="w-4 h-4" />
          <div>
            <p className="font-medium">Automatic Cleanup</p>
            <p className="text-sm">
              Jobs older than 90 days are automatically archived and their assets are cleaned up to save storage space.
            </p>
          </div>
        </Alert>
      </Card>
    </div>
  );
}

