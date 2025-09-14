/**
 * Admin Queue Management Component
 * Handles queue statistics, DLQ operations, and admin functions
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, ProgressBar, Alert, Table } from '@tremor/react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface QueueStats {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  dlq: number;
}

interface DLQJob {
  id: string;
  originalQueue: string;
  originalJob: {
    id: string;
    name: string;
    data: any;
  };
  error: {
    message: string;
    stack: string;
  };
  failedAt: string;
  attemptsMade: number;
  reason?: string;
}

interface SystemHealth {
  healthy: boolean;
  queues: QueueStats[];
  totalJobs: number;
  totalDLQ: number;
  issues: string[];
}

export default function AdminQueues() {
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [dlqJobs, setDlqJobs] = useState<DLQJob[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadQueueStats();
    loadSystemHealth();
  }, []);

  const loadQueueStats = async () => {
    try {
      const response = await fetch('/api/queues/stats');
      const data = await response.json();
      if (data.success) {
        setQueueStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load queue stats:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/queues/health');
      const data = await response.json();
      if (data.success) {
        setSystemHealth(data.data);
      }
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  };

  const loadDLQJobs = async (queueName: string) => {
    try {
      const response = await fetch(`/api/queues/dlq/${queueName}/jobs?limit=50`);
      const data = await response.json();
      if (data.success) {
        setDlqJobs(data.data);
        setSelectedQueue(queueName);
      }
    } catch (error) {
      console.error('Failed to load DLQ jobs:', error);
    }
  };

  const pauseQueue = async (queueName: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/queues/${queueName}/pause`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Queue ${queueName} paused`);
        loadQueueStats();
      } else {
        setError(data.error || 'Failed to pause queue');
      }
    } catch (error) {
      setError('Failed to pause queue');
    } finally {
      setIsLoading(false);
    }
  };

  const resumeQueue = async (queueName: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/queues/${queueName}/resume`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Queue ${queueName} resumed`);
        loadQueueStats();
      } else {
        setError(data.error || 'Failed to resume queue');
      }
    } catch (error) {
      setError('Failed to resume queue');
    } finally {
      setIsLoading(false);
    }
  };

  const clearQueue = async (queueName: string, state: string = 'waiting') => {
    if (!confirm(`Are you sure you want to clear all ${state} jobs from ${queueName}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/queues/${queueName}/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state })
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Cleared ${data.data.cleared} jobs from ${queueName}`);
        loadQueueStats();
      } else {
        setError(data.error || 'Failed to clear queue');
      }
    } catch (error) {
      setError('Failed to clear queue');
    } finally {
      setIsLoading(false);
    }
  };

  const replayFromDLQ = async (queueName: string, limit: number = 10) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/queues/dlq/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue: queueName,
          limit,
          reason: 'Manual replay',
          backoff: true
        })
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Replayed ${data.data.replayed} jobs from ${queueName} DLQ`);
        loadQueueStats();
        if (selectedQueue === queueName) {
          loadDLQJobs(queueName);
        }
      } else {
        setError(data.error || 'Failed to replay from DLQ');
      }
    } catch (error) {
      setError('Failed to replay from DLQ');
    } finally {
      setIsLoading(false);
    }
  };

  const clearDLQ = async (queueName: string) => {
    if (!confirm(`Are you sure you want to clear all jobs from ${queueName} DLQ?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/queues/${queueName}/dlq/clear`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Cleared ${data.data.cleared} jobs from ${queueName} DLQ`);
        loadQueueStats();
        if (selectedQueue === queueName) {
          loadDLQJobs(queueName);
        }
      } else {
        setError(data.error || 'Failed to clear DLQ');
      }
    } catch (error) {
      setError('Failed to clear DLQ');
    } finally {
      setIsLoading(false);
    }
  };

  const getQueueHealthColor = (queue: QueueStats) => {
    if (queue.paused) return 'yellow';
    if (queue.dlq > 20) return 'red';
    if (queue.waiting > 50) return 'orange';
    return 'green';
  };

  const getQueueHealthLabel = (queue: QueueStats) => {
    if (queue.paused) return 'Paused';
    if (queue.dlq > 20) return 'High DLQ';
    if (queue.waiting > 50) return 'Overloaded';
    return 'Healthy';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">Queue Management</h2>
          </div>
          <Button
            onClick={() => {
              loadQueueStats();
              loadSystemHealth();
            }}
            disabled={isLoading}
            size="sm"
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
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

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemHealth.totalJobs}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{systemHealth.totalDLQ}</div>
              <div className="text-sm text-gray-600">DLQ Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemHealth.queues.length}</div>
              <div className="text-sm text-gray-600">Active Queues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemHealth.issues.length}</div>
              <div className="text-sm text-gray-600">Issues</div>
            </div>
          </div>

          {systemHealth.issues.length > 0 && (
            <Alert color="red">
              <AlertTriangle className="w-4 h-4" />
              <div>
                <p className="font-medium">System Issues</p>
                <ul className="text-sm list-disc list-inside">
                  {systemHealth.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
        </Card>
      )}

      {/* Queue Statistics */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Queue Statistics</h3>
        
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th>Queue</th>
                <th>Status</th>
                <th>Active</th>
                <th>Waiting</th>
                <th>Completed</th>
                <th>Failed</th>
                <th>DLQ</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queueStats.map((queue) => (
                <tr key={queue.name}>
                  <td className="font-medium">{queue.name}</td>
                  <td>
                    <Badge color={getQueueHealthColor(queue) as any}>
                      {getQueueHealthLabel(queue)}
                    </Badge>
                  </td>
                  <td>{queue.active}</td>
                  <td>{queue.waiting}</td>
                  <td>{queue.completed}</td>
                  <td>{queue.failed}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <span>{queue.dlq}</span>
                      {queue.dlq > 0 && (
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => loadDLQJobs(queue.name)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-1">
                      {queue.paused ? (
                        <Button
                          size="sm"
                          onClick={() => resumeQueue(queue.name)}
                          disabled={isLoading}
                          className="flex items-center space-x-1"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="light"
                          onClick={() => pauseQueue(queue.name)}
                          disabled={isLoading}
                          className="flex items-center space-x-1"
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="light"
                        onClick={() => clearQueue(queue.name)}
                        disabled={isLoading}
                        className="flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* DLQ Jobs */}
      {selectedQueue && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Dead Letter Queue: {selectedQueue}
            </h3>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => replayFromDLQ(selectedQueue, 10)}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay 10</span>
              </Button>
              <Button
                size="sm"
                variant="light"
                onClick={() => clearDLQ(selectedQueue)}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear DLQ</span>
              </Button>
            </div>
          </div>

          {dlqJobs.length > 0 ? (
            <div className="space-y-2">
              {dlqJobs.map((job) => (
                <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Job {job.originalJob.id}</p>
                      <p className="text-sm text-gray-600">
                        Failed: {new Date(job.failedAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Attempts: {job.attemptsMade}
                      </p>
                      <p className="text-sm text-red-600">
                        Error: {job.error.message}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => replayFromDLQ(selectedQueue, 1)}
                      disabled={isLoading}
                    >
                      Replay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No jobs in DLQ</p>
          )}
        </Card>
      )}
    </div>
  );
}

