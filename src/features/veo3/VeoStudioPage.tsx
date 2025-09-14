import { useState, useEffect } from 'react';
import { Card, Title, Text, Button, Badge, ProgressBar } from '@tremor/react';
import { 
  Wand2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock
} from 'lucide-react';
import { VeoPromptJSON, VeoGenerationJob, VeoJobStatus } from './types';
import { createDefaultVeoPrompt } from './promptBuilder';
import { PLATFORM_PRESETS } from './presets';
import AssetPicker from './components/AssetPicker';
import PromptForm from './components/PromptForm';
import PromptPreview from './components/PromptPreview';

export default function VeoStudioPage() {
  const [prompt, setPrompt] = useState<VeoPromptJSON>(() => 
    createDefaultVeoPrompt('tiktok')
  );
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<VeoGenerationJob | null>(null);
  const [generationStatus, setGenerationStatus] = useState<VeoJobStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);

  // Load quota info on mount
  useEffect(() => {
    loadQuotaInfo();
  }, []);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseConnection) {
        sseConnection.close();
      }
    };
  }, [sseConnection]);

  const loadQuotaInfo = async () => {
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/veo3/quota', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const quota = await response.json();
        setQuotaInfo(quota);
      }
    } catch (error) {
      console.error('Error loading quota info:', error);
    }
  };

  const startSSEConnection = (jobId: string) => {
    const token = localStorage.getItem('testToken') || 'test-token';
    const eventSource = new EventSource(`/api/veo3/jobs/${jobId}/events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different event types
        if (data.type === 'heartbeat') {
          // Just keep connection alive, no action needed
          return;
        }
        
        if (data.type === 'gone') {
          console.warn('Job not found, closing SSE connection');
          eventSource.close();
          setSseConnection(null);
          setIsGenerating(false);
          return;
        }
        
        if (data.type === 'error') {
          console.error('SSE error:', data.message);
          eventSource.close();
          setSseConnection(null);
          // Fallback to polling
          const interval = setInterval(async () => {
            await pollJobStatus(jobId);
          }, 3000);
          setPollingInterval(interval);
          return;
        }
        
        // Handle status updates
        if (data.type === 'status') {
          setGenerationStatus(prev => ({
            ...prev,
            status: data.status,
            progress: data.progress,
            result: data.outputUrl ? {
              videoUrl: data.outputUrl,
              thumbnailUrl: data.outputUrl.replace('.mp4', '_thumb.jpg'),
              duration: 8
            } : prev?.result,
            error: data.errorMessage
          }));

          if (data.status === 'done' || data.status === 'error') {
            setIsGenerating(false);
            eventSource.close();
            setSseConnection(null);
            loadQuotaInfo(); // Refresh quota info
          }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      setSseConnection(null);
      
      // Fallback to polling
      const interval = setInterval(async () => {
        await pollJobStatus(jobId);
      }, 3000);
      
      setPollingInterval(interval);
    };

    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    setSseConnection(eventSource);
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch(`/api/veo3/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const status: VeoJobStatus = await response.json();
        setGenerationStatus(prev => ({
          ...prev,
          status: status.status,
          progress: status.progress,
          result: status.outputUrl ? {
            videoUrl: status.outputUrl,
            thumbnailUrl: status.outputUrl.replace('.mp4', '_thumb.jpg'),
            duration: 8
          } : prev?.result,
          error: status.errorMessage
        }));
        
        if (status.status === 'done' || status.status === 'error') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setIsGenerating(false);
          loadQuotaInfo(); // Refresh quota info
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };

  const handleGenerate = async () => {
    if (!isValid) {
      alert('Please fix validation errors before generating');
      return;
    }

    try {
      setIsGenerating(true);
      
      // Get auth token
      const token = localStorage.getItem('testToken') || 'test-token';
      
      const idempotencyKey = `veo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/veo3/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Generation failed');
      }

      const result = await response.json();
      
      // Create a job object for tracking
      const job: VeoGenerationJob = {
        id: result.jobId,
        status: 'queued',
        prompt,
        config: {
          aspectRatio: prompt.aspect,
          resolution: prompt.resolution || (prompt.aspect === '16:9' ? '1080p' : '720p'),
          negativePrompt: prompt.negativePrompt || 'low quality, washed out, jittery motion, frame drops',
          seed: prompt.seed || 0
        },
        result: undefined,
        error: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setCurrentJob(job);
      setGenerationStatus({
        jobId: result.jobId,
        status: 'queued',
        progress: 0,
        estimatedTimeRemaining: 60
      });

      // Start SSE connection for real-time updates
      startSSEConnection(result.jobId);
      
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownload = () => {
    if (currentJob?.id) {
      const token = localStorage.getItem('testToken') || 'test-token';
      window.open(`/api/veo3/jobs/${currentJob.id}/download?token=${token}`, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'queued': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'green';
      case 'error': return 'red';
      case 'running': return 'blue';
      case 'queued': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Title className="text-3xl font-bold text-gray-900 mb-2">
            Veo 3 Cinematic Generator
          </Title>
          <Text className="text-lg text-gray-600">
            Transform your ideas into polished 8-second video creatives with AI
          </Text>
        </div>

        {/* Generation Status */}
        {isGenerating && generationStatus && (
          <Card className="mb-6 p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center space-x-4">
              {getStatusIcon(generationStatus.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <Text className="font-medium">Generating Video</Text>
                  <Badge color={getStatusColor(generationStatus.status)}>
                    {generationStatus.status}
                  </Badge>
                </div>
                
                {generationStatus.progress !== undefined && (
                  <ProgressBar 
                    value={generationStatus.progress} 
                    className="mb-2"
                  />
                )}
                
                <Text className="text-sm text-gray-600">
                  {generationStatus.estimatedTimeRemaining && 
                    `Estimated time remaining: ${generationStatus.estimatedTimeRemaining}s`
                  }
                </Text>
              </div>
            </div>
          </Card>
        )}

        {/* Completed Generation */}
        {generationStatus?.status === 'done' && generationStatus.result && (
          <Card className="mb-6 p-6 border-green-200 bg-green-50">
            <div className="flex items-center space-x-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="flex-1">
                <Text className="font-medium text-green-800 mb-2">
                  Video Generated Successfully!
                </Text>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleDownload}
                    icon={Download}
                    color="green"
                  >
                    Download MP4
                  </Button>
                  {generationStatus.result.thumbnailUrl && (
                    <Button
                      onClick={() => window.open(generationStatus.result!.thumbnailUrl, '_blank')}
                      variant="light"
                    >
                      View Thumbnail
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Failed Generation */}
        {generationStatus?.status === 'error' && (
          <Card className="mb-6 p-4 border-red-200 bg-red-50">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <Text className="font-medium text-red-800">Generation Failed</Text>
                <Text className="text-sm text-red-600">
                  {generationStatus.error || 'An unknown error occurred during generation'}
                </Text>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <AssetPicker
              assets={prompt.visualRefs}
              onAssetsChange={(assets) => setPrompt({ ...prompt, visualRefs: assets })}
            />
            
            <PromptForm
              prompt={prompt}
              onPromptChange={setPrompt}
              onValidationChange={(valid, errors) => {
                setIsValid(valid);
                setValidationErrors(errors);
              }}
            />
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <PromptPreview
              prompt={prompt}
              isValid={isValid}
            />

            {/* Generation Controls */}
            <Card className="p-6">
              <Title className="mb-4">Generate Video</Title>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Text>Platform: {PLATFORM_PRESETS[prompt.platform]?.name}</Text>
                  <Badge color="blue">
                    {prompt.aspect} • {prompt.resolution}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text>Duration: {prompt.durationSec}s</Text>
                  <Badge color="green">8s max</Badge>
                </div>

                {validationErrors.length > 0 && (
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <Text className="font-medium text-red-800">Validation Errors</Text>
                    </div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!isValid || isGenerating}
                  icon={isGenerating ? RefreshCw : Wand2}
                  color="blue"
                  size="lg"
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate Video'}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  <p>• Generation typically takes 30-60 seconds</p>
                  <p>• Videos are optimized for the selected platform</p>
                  <p>• Download link will appear when ready</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quota Info */}
        {quotaInfo && (
          <Card className="mt-6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="font-medium">Daily Usage</Text>
                <Text className="text-sm text-gray-600">
                  {quotaInfo.quota.used} of {quotaInfo.quota.limit} renders today
                </Text>
              </div>
              <div>
                <Text className="font-medium">Concurrent Jobs</Text>
                <Text className="text-sm text-gray-600">
                  {quotaInfo.concurrency.running} of {quotaInfo.concurrency.limit} running
                </Text>
              </div>
            </div>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <Text className="text-sm text-gray-500">
            Powered by Google's Veo 3 • Professional video generation • 8-second optimized creatives
          </Text>
        </div>
      </div>
    </div>
  );
}
