import React from "react";


import toast from 'react-hot-toast';

interface VideoGeneratorProps {
  onComplete?: (videoUrl: string) => void;
  initialPrompt?: string;
  initialStyle?: string;
}

export default function VideoGenerator({ onComplete, initialPrompt, initialStyle }: VideoGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [style, setStyle] = useState(initialStyle || 'cinematic');
  const [duration, setDuration] = useState(30);
  const [format, setFormat] = useState<'landscape' | 'portrait' | 'square'>('portrait');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
    if (initialStyle) {
      setStyle(initialStyle);
    }
  }, [initialPrompt, initialStyle]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (videoData?.status === 'pending' || videoData?.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const status = await getVideoStatus(videoData.id);
          setVideoData(status);
          
          if (status.status === 'completed' && status.url) {
            clearInterval(interval);
            const s3Url = await uploadToS3(status.url, `${status.id}.mp4`);
            onComplete?.(s3Url);
            toast.success('Video generated successfully!');
          } else if (status.status === 'failed') {
            clearInterval(interval);
            setError('Video generation failed. Please try again.');
            toast.error('Failed to generate video');
          }
        } catch (error) {
          console.error('Status check error:', error);
          toast.error('Error checking video status');
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [videoData]);

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const video = await generateVideo({
        prompt,
        style,
        duration,
        format,
        resolution: '1080p'
      });
      
      setVideoData(video);
      toast.success('Video generation started');
    } catch (error) {
      console.error('Generation error:', error);
      setError('Failed to start video generation');
      toast.error('Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>AI Video Generator</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Generate professional videos with AI
            </Text>
          </div>
          {videoData?.status === 'completed' && videoData.url && (
            <a
              href={videoData.url}
              download
              className="btn-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </a>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Describe your video..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="form-select"
              >
                <option value="cinematic">Cinematic</option>
                <option value="commercial">Commercial</option>
                <option value="documentary">Documentary</option>
                <option value="social">Social Media</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min={5}
                max={60}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'landscape' | 'portrait' | 'square')}
                className="form-select"
              >
                <option value="portrait">Portrait (9:16)</option>
                <option value="landscape">Landscape (16:9)</option>
                <option value="square">Square (1:1)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt || videoData?.status === 'processing'}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Video
                </>
              )}
            </button>
          </div>

          {videoData && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Generation Status
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {videoData.status === 'completed' ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : videoData.status === 'failed' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
                )}
                <span className="text-sm capitalize">{videoData.status}</span>
              </div>

              {videoData.status === 'completed' && videoData.url && (
                <div className="mt-4">
                  <video
                    src={videoData.url}
                    controls
                    className="w-full rounded-lg"
                    poster={videoData.thumbnail}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}