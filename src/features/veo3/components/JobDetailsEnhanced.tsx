/**
 * Enhanced Job Details Component
 * Shows model used, quality score, warnings, HLS info, and sprite timeline
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, ProgressBar, Alert } from '@tremor/react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Cpu, 
  Star, 
  Eye,
  Download,
  Share2,
  Settings,
  Play
} from 'lucide-react';
import HLSPlayer from './HLSPlayer';

interface JobDetailsEnhancedProps {
  job: {
    id: string;
    status: string;
    progress: number;
    model_used?: string;
    quality_score?: number;
    quality_detail?: any;
    hls_master_url?: string;
    sprites_image_url?: string;
    sprites_vtt_url?: string;
    output_url?: string;
    thumbnail_url?: string;
    created_at: string;
    completed_at?: string;
    error_message?: string;
  };
  onDownload?: () => void;
  onShare?: () => void;
  onRegenerate?: () => void;
  onViewHLS?: () => void;
}

export default function JobDetailsEnhanced({
  job,
  onDownload,
  onShare,
  onRegenerate,
  onViewHLS
}: JobDetailsEnhancedProps) {
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [showHLSPlayer, setShowHLSPlayer] = useState(false);

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
      case 'done':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
      case 'done':
        return 'green';
      case 'error':
        return 'red';
      case 'running':
      case 'processing':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const generateStreamToken = async () => {
    try {
      const response = await fetch(`/api/delivery/stream/token/${job.id}`);
      const data = await response.json();
      return data.data?.token;
    } catch (error) {
      console.error('Failed to generate stream token:', error);
      return null;
    }
  };

  const handlePlayHLS = async () => {
    if (!job.hls_master_url) return;
    
    const token = await generateStreamToken();
    if (token) {
      const masterUrl = `/stream/veo/${job.id}/master.m3u8?token=${token}`;
      setShowHLSPlayer(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Job Status Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold">Job Status</h3>
              <p className="text-sm text-gray-600">
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </p>
            </div>
          </div>
          <Badge color={getStatusColor() as any}>
            {job.status}
          </Badge>
        </div>

        {job.status === 'running' || job.status === 'processing' ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <ProgressBar value={job.progress} className="w-full" />
          </div>
        ) : null}

        {job.error_message && (
          <Alert color="red" className="mt-4">
            <AlertTriangle className="w-4 h-4" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{job.error_message}</p>
            </div>
          </Alert>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Created:</span>
            <p>{new Date(job.created_at).toLocaleString()}</p>
          </div>
          {job.completed_at && (
            <div>
              <span className="text-gray-600">Duration:</span>
              <p>{formatDuration(job.created_at, job.completed_at)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Model Information */}
      {job.model_used && (
        <Card>
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Model Used</h3>
          </div>
          <Badge color="blue" size="sm">
            {job.model_used}
          </Badge>
        </Card>
      )}

      {/* Quality Score */}
      {job.quality_score !== undefined && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">Quality Score</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Badge color={getQualityColor(job.quality_score) as any}>
                {getQualityLabel(job.quality_score)}
              </Badge>
              <span className="text-2xl font-bold">
                {(job.quality_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Quality</span>
              <span>{(job.quality_score * 100).toFixed(0)}%</span>
            </div>
            <ProgressBar 
              value={job.quality_score * 100} 
              color={getQualityColor(job.quality_score) as any}
              className="w-full" 
            />
          </div>

          {job.quality_detail && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="light"
                onClick={() => setShowQualityDetails(!showQualityDetails)}
              >
                {showQualityDetails ? 'Hide' : 'Show'} Details
              </Button>

              {showQualityDetails && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Visual:</span>
                      <span className="ml-2 font-medium">
                        {(job.quality_detail.visual * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Audio:</span>
                      <span className="ml-2 font-medium">
                        {(job.quality_detail.audio * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Coherence:</span>
                      <span className="ml-2 font-medium">
                        {(job.quality_detail.coherence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sharpness:</span>
                      <span className="ml-2 font-medium">
                        {(job.quality_detail.sharpness * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* HLS Streaming */}
      {job.hls_master_url && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">HLS Streaming</h3>
            </div>
            <Badge color="green" size="sm">
              Available
            </Badge>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Adaptive streaming with multiple quality variants
            </p>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handlePlayHLS}
                className="flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Play HLS</span>
              </Button>
              
              {onViewHLS && (
                <Button
                  size="sm"
                  variant="light"
                  onClick={onViewHLS}
                >
                  View Details
                </Button>
              )}
            </div>

            {job.sprites_image_url && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>Sprite thumbnails available</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Video Preview */}
      {job.output_url && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Video Preview</h3>
          
          {showHLSPlayer && job.hls_master_url ? (
            <HLSPlayer
              masterUrl={`/stream/veo/${job.id}/master.m3u8`}
              fallbackUrl={job.output_url}
              sprites={job.sprites_image_url ? {
                imageUrl: job.sprites_image_url,
                vttUrl: job.sprites_vtt_url || ''
              } : undefined}
              poster={job.thumbnail_url}
              className="mb-4"
            />
          ) : (
            <div className="relative">
              <video
                src={job.output_url}
                poster={job.thumbnail_url}
                controls
                className="w-full h-auto rounded-lg"
                preload="metadata"
              />
              {job.hls_master_url && (
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="light"
                    onClick={handlePlayHLS}
                    className="bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    HLS
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {onDownload && job.output_url && (
            <Button
              size="sm"
              onClick={onDownload}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          )}
          
          {onShare && (
            <Button
              size="sm"
              variant="light"
              onClick={onShare}
              className="flex items-center space-x-1"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
          )}
          
          {onRegenerate && (
            <Button
              size="sm"
              variant="light"
              onClick={onRegenerate}
              className="flex items-center space-x-1"
            >
              <Settings className="w-4 h-4" />
              <span>Regenerate</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

