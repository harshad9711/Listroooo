/**
 * HLS Player Component
 * Video player with HLS support and MP4 fallback
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, Badge, Button } from '@tremor/react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

interface HLSPlayerProps {
  masterUrl: string;
  fallbackUrl?: string;
  sprites?: {
    imageUrl: string;
    vttUrl: string;
  };
  poster?: string;
  className?: string;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

export default function HLSPlayer({
  masterUrl,
  fallbackUrl,
  sprites,
  poster,
  className = '',
  onError,
  onLoadStart,
  onLoadEnd
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsSupported, setHlsSupported] = useState(false);

  // Check HLS support
  useEffect(() => {
    const checkHLSSupport = () => {
      const video = videoRef.current;
      if (!video) return false;

      return video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
             (window as any).Hls?.isSupported() === true;
    };

    setHlsSupported(checkHLSSupport());
  }, []);

  // Initialize HLS
  useEffect(() => {
    if (!videoRef.current || !masterUrl) return;

    const video = videoRef.current;
    let hls: any = null;

    const initializeHLS = async () => {
      try {
        onLoadStart?.();

        // Check if native HLS is supported (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl') !== '') {
          video.src = masterUrl;
          setHlsSupported(true);
        } else if ((window as any).Hls?.isSupported()) {
          // Use hls.js for other browsers
          const Hls = (window as any).Hls;
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hls.loadSource(masterUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            onLoadEnd?.();
          });

          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              // Try fallback URL
              if (fallbackUrl) {
                video.src = fallbackUrl;
                setError(null);
              } else {
                setError('Video playback failed');
                onError?.('Video playback failed');
              }
            }
          });

          setHlsSupported(true);
        } else {
          // Fallback to MP4
          if (fallbackUrl) {
            video.src = fallbackUrl;
            setHlsSupported(false);
          } else {
            setError('HLS not supported and no fallback available');
            onError?.('HLS not supported and no fallback available');
          }
        }

        // Video event listeners
        video.addEventListener('loadedmetadata', () => {
          setDuration(video.duration);
          setIsLoading(false);
          onLoadEnd?.();
        });

        video.addEventListener('timeupdate', () => {
          setCurrentTime(video.currentTime);
        });

        video.addEventListener('play', () => {
          setIsPlaying(true);
        });

        video.addEventListener('pause', () => {
          setIsPlaying(false);
        });

        video.addEventListener('volumechange', () => {
          setIsMuted(video.muted);
          setVolume(video.volume);
        });

        video.addEventListener('error', (e) => {
          const error = (e.target as HTMLVideoElement).error;
          const errorMessage = error ? `Video error: ${error.message}` : 'Video playback failed';
          setError(errorMessage);
          onError?.(errorMessage);
        });

      } catch (err) {
        console.error('HLS initialization error:', err);
        setError('Failed to initialize video player');
        onError?.('Failed to initialize video player');
      }
    };

    initializeHLS();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [masterUrl, fallbackUrl, onLoadStart, onLoadEnd, onError]);

  // Player controls
  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (error) {
    return (
      <Card className={`p-4 text-center ${className}`}>
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-sm text-gray-600">{error}</p>
        {fallbackUrl && (
          <Button 
            size="sm" 
            className="mt-2"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.src = fallbackUrl;
                setError(null);
              }
            }}
          >
            Try Fallback
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        playsInline
        preload="metadata"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        {/* Progress Bar */}
        <div 
          className="w-full h-1 bg-gray-600 rounded-full mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {hlsSupported && (
              <Badge color="blue" size="sm">
                HLS
              </Badge>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sprite Thumbnails (if available) */}
      {sprites && (
        <div className="absolute top-2 right-2">
          <Badge color="green" size="sm">
            Thumbnails
          </Badge>
        </div>
      )}
    </Card>
  );
}

