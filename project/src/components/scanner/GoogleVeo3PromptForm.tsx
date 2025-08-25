import React, { useState, useEffect } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { 
  Play, 
  Settings, 
  Sparkles, 
  Download, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { googleVeo3Real, Veo3VideoOptions, Veo3VideoResult } from '../../services/googleVeo3Real';
import { veo3Config } from '../../config/veo3.config';

interface GoogleVeo3PromptFormProps {
  userId?: string;
  onVideoGenerated?: (video: Veo3VideoResult) => void;
}

export default function GoogleVeo3PromptForm({ userId, onVideoGenerated }: GoogleVeo3PromptFormProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [tone, setTone] = useState('energetic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [targetPlatform, setTargetPlatform] = useState('Instagram Reels');
  const [duration, setDuration] = useState(15);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [format, setFormat] = useState<'landscape' | 'portrait' | 'square'>('landscape');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeVideos, setActiveVideos] = useState<Veo3VideoResult[]>([]);
  const [completedVideos, setCompletedVideos] = useState<Veo3VideoResult[]>([]);

  // Poll for video status updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeVideos.length > 0) {
        updateVideoStatuses();
      }
    }, veo3Config.processing.statusUpdateInterval);

    return () => clearInterval(interval);
  }, [activeVideos]);

  const updateVideoStatuses = async () => {
    try {
      const updatedVideos = await Promise.all(
        activeVideos.map(async (video) => {
          // Get real status from database
          const realStatus = await googleVeo3Real.getVideoStatus(video.id);
          return realStatus || video;
        })
      );

      // Separate active and completed videos
      const stillActive = updatedVideos.filter(v => v && (v.status === 'pending' || v.status === 'processing'));
      const newlyCompleted = updatedVideos.filter(v => v && v.status === 'completed');
      const failedVideos = updatedVideos.filter(v => v && v.status === 'failed');
      
      setActiveVideos(stillActive);
      setCompletedVideos(prev => [...prev, ...newlyCompleted]);

      // Handle failed videos
      if (failedVideos.length > 0) {
        failedVideos.forEach(video => {
          toast.error(`Video generation failed: ${video.error || 'Unknown error'}`);
        });
      }

      // Notify parent component of completed videos
      newlyCompleted.forEach(video => {
        onVideoGenerated?.(video);
      });
    } catch (error) {
      console.error('Error updating video statuses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const videoOptions: Veo3VideoOptions = {
        prompt: prompt.trim(),
        style,
        tone,
        aspectRatio,
        targetPlatform,
        duration,
        resolution,
        format,
      };

      const video = await googleVeo3Real.generateVideo(userId || 'anonymous', videoOptions);
      
      setActiveVideos(prev => [...prev, video]);
      setPrompt(''); // Clear prompt after submission
      toast.success('Video generation started!');
      
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to start video generation');
      toast.error('Failed to start video generation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await googleVeo3Real.deleteVideo(videoId);
      setActiveVideos(prev => prev.filter(v => v.id !== videoId));
      setCompletedVideos(prev => prev.filter(v => v.id !== videoId));
      toast.success('Video deleted successfully');
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const getStatusIcon = (status: Veo3VideoResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: Veo3VideoResult['status']) => {
    switch (status) {
      case 'pending':
        return 'Queued';
      case 'processing':
        return 'Generating...';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input Form */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            <div>
              <Title>Google Veo 3 Video Generator</Title>
              <Text className="text-gray-500 dark:text-gray-400">
                Bring your ideas to life with AI-generated videos
              </Text>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe Your Video
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A cinematic product showcase for wireless earbuds with smooth camera movements and modern aesthetics..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
            </div>

            {/* Style Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="modern">Modern</option>
                  <option value="vintage">Vintage</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="playful">Playful</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                  <option value="mysterious">Mysterious</option>
                  <option value="uplifting">Uplifting</option>
                  <option value="sophisticated">Sophisticated</option>
                  <option value="fun">Fun</option>
                  <option value="serious">Serious</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="16:9">16:9 (Landscape)</option>
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="1:1">1:1 (Square)</option>
                  <option value="4:5">4:5 (Instagram)</option>
                  <option value="21:9">21:9 (Ultrawide)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Platform
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Twitter">Twitter</option>
                  <option value="Website">Website</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value as '720p' | '1080p' | '4k')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Starting Generation...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Generate Video</span>
                </>
              )}
            </button>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </div>
      </Card>

      {/* Active Videos */}
      {activeVideos.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <Title className="mb-4">Generating Videos</Title>
            <div className="space-y-3">
              {activeVideos.map((video) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(video.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {video.prompt.length > 50 ? `${video.prompt.substring(0, 50)}...` : video.prompt}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getStatusText(video.status)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Completed Videos */}
      {completedVideos.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <Title className="mb-4">Generated Videos</Title>
            <div className="space-y-3">
              {completedVideos.map((video) => (
                <div key={video.id} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Video Ready
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(video.videoUrl, '_blank')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <Play className="h-4 w-4" />
                        <span>Play</span>
                      </button>
                      <button
                        onClick={() => window.open(video.videoUrl, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {video.prompt}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Duration: {video.duration}s</span>
                    <span>Resolution: {video.metadata?.resolution}</span>
                    <span>Style: {video.metadata?.style}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
