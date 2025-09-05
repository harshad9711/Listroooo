import React, { useState, useEffect } from 'react';
import { Card, Title, Text } from '@tremor/react';
import { 
  History, 
  Settings, 
  Lightbulb, 
  Sparkles, 
  AlertCircle,
  Play,
  Download,
  Trash2
} from 'lucide-react';
import GoogleVeo3PromptForm from './GoogleVeo3PromptForm';
import { Veo3VideoResult } from '../../services/googleVeo3';
import { googleVeo3Real } from '../../services/googleVeo3Real';
import toast from 'react-hot-toast';

const examplePrompts = [
  {
    title: 'Product Showcase',
    prompt: 'A cinematic product showcase for wireless earbuds with smooth camera movements and modern aesthetics',
    style: 'cinematic',
    tone: 'energetic'
  },
  {
    title: 'Lifestyle Video',
    prompt: 'A lifestyle video showing people enjoying coffee in a cozy café setting with warm lighting',
    style: 'modern',
    tone: 'calm'
  },
  {
    title: 'Brand Story',
    prompt: 'A brand story video showcasing the journey of a sustainable fashion company with documentary-style footage',
    style: 'documentary',
    tone: 'sophisticated'
  },
  {
    title: 'Social Media Ad',
    prompt: 'An engaging social media ad for a fitness app with dynamic movements and motivational energy',
    style: 'energetic',
    tone: 'uplifting'
  }
];

export default function GoogleVeo3Integration() {
  const [showHistory, setShowHistory] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<Veo3VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID (you'll need to implement this based on your auth system)
  useEffect(() => {
    // TODO: Replace with your actual auth system
    const getCurrentUser = async () => {
      try {
        // This should come from your Supabase auth context
        // For now, we'll use a placeholder
        setUserId('current-user-id');
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

  // Load user's existing videos
  useEffect(() => {
    if (userId) {
      loadUserVideos();
    }
  }, [userId]);

  const loadUserVideos = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const videos = await googleVeo3Real.getUserVideos(userId, 50);
      setGeneratedVideos(videos);
    } catch (error) {
      console.error('Error loading user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsePrompt = (prompt: typeof examplePrompts[0]) => {
    // Handle the example prompt selection
    console.log('Using example prompt:', prompt);
    // TODO: Pre-fill the form with this prompt
  };

  const handleVideoGenerated = (video: Veo3VideoResult) => {
    setGeneratedVideos(prev => [video, ...prev]);
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const success = await googleVeo3Real.deleteVideo(videoId);
      if (success) {
        setGeneratedVideos(prev => prev.filter(v => v.id !== videoId));
        toast.success('Video deleted successfully');
      } else {
        toast.error('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Google Veo 3 AI Video</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generate professional AI videos from your prompts using Google's latest Veo 3 technology
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary"
          >
            <History className="h-4 w-4 mr-2" />
            {showHistory ? 'Hide' : 'Show'} History
          </button>
          <button className="btn-secondary">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Prompt Form */}
        <div className="lg:col-span-2">
          <GoogleVeo3PromptForm 
            onVideoGenerated={handleVideoGenerated}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips & Guidelines */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <Title>Writing Tips</Title>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p>• Be specific about visual elements</p>
                <p>• Include camera movements and angles</p>
                <p>• Describe lighting and atmosphere</p>
                <p>• Mention target audience and platform</p>
                <p>• Use descriptive adjectives for style</p>
              </div>
            </div>
          </Card>

          {/* Example Prompts */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <Title>Example Prompts</Title>
              </div>
              
              <div className="space-y-4">
                {examplePrompts.map((prompt, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => handleUsePrompt(prompt)}
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                      {prompt.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {prompt.prompt}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button 
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUsePrompt(prompt);
                        }}
                      >
                        Use this prompt →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Recent Videos */}
          {generatedVideos.length > 0 && (
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Play className="h-5 w-5 text-green-500" />
                  <Title>Recent Videos</Title>
                </div>
                
                <div className="space-y-3">
                  {generatedVideos.slice(0, 3).map((video) => (
                    <div key={video.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {video.prompt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{video.metadata?.style}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => window.open(video.videoUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-700 p-1"
                          >
                            <Play className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => window.open(video.videoUrl, '_blank')}
                            className="text-green-600 hover:text-green-700 p-1"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Feature Info */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <Title>About Veo 3</Title>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p>Google Veo 3 is the latest AI video generation technology that creates high-quality, realistic videos from text prompts.</p>
                <p>Features:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Up to 4K resolution</li>
                  <li>Multiple aspect ratios</li>
                  <li>Style and tone control</li>
                  <li>Platform-optimized output</li>
                  <li>Fast generation times</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
