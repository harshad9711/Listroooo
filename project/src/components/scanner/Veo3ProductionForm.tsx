import React from "react";


import {
  Sparkles, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Download, 
  Star,
  History,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Veo3ProductionFormProps {
  userId: string;
  onJobCreated?: (job: Veo3GenerationJob) => void;
}

interface PromptInput {
  id: string;
  text: string;
  type: 'video' | 'image' | 'ad';
  style: string;
  tone: string;
  aspectRatio: string;
  targetPlatform: string;
}

export default function Veo3ProductionForm({ userId, onJobCreated }: Veo3ProductionFormProps) {
  const [prompts, setPrompts] = useState<PromptInput[]>([
    {
      id: crypto.randomUUID(),
      text: '',
      type: 'video',
      style: 'cinematic',
      tone: 'energetic',
      aspectRatio: '16:9',
      targetPlatform: 'Instagram Reels',
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeJobs, setActiveJobs] = useState<Veo3GenerationJob[]>([]);
  const [jobHistory, setJobHistory] = useState<Veo3GenerationJob[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Veo3GenerationJob | null>(null);

  // Poll for job status updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (activeJobs.length > 0) {
        const updatedJobs = await Promise.all(
          activeJobs.map(async (job) => {
            const updatedJob = await veo3Production.getJobStatus(job.id);
            return updatedJob || job;
          })
        );
        
        setActiveJobs(updatedJobs.filter(job => job && job.status === 'pending' || job.status === 'processing'));
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeJobs]);

  // Load job history on mount
  useEffect(() => {
    loadJobHistory();
  }, []);

  const loadJobHistory = async () => {
    try {
      const history = await veo3Production.getUserJobs(userId, 50);
      setJobHistory(history);
    } catch (error) {
      console.error('Error loading job history:', error);
    }
  };

  const addPrompt = () => {
    setPrompts([
      ...prompts,
      {
        id: crypto.randomUUID(),
        text: '',
        type: 'video',
        style: 'cinematic',
        tone: 'energetic',
        aspectRatio: '16:9',
        targetPlatform: 'Instagram Reels',
      }
    ]);
  };

  const removePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const updatePrompt = (id: string, field: keyof PromptInput, value: string) => {
    setPrompts(prompts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate prompts
      const validPrompts = prompts.filter(p => p.text.trim());
      if (validPrompts.length === 0) {
        throw new Error('Please enter at least one prompt');
      }

      // Create batch job
      const job = await veo3Production.createJob(
        userId,
        'batch',
        validPrompts.map(p => p.text),
        {
          style: validPrompts[0].style,
          tone: validPrompts[0].tone,
          aspectRatio: validPrompts[0].aspectRatio,
          targetPlatform: validPrompts[0].targetPlatform,
        }
      );

      setActiveJobs(prev => [...prev, job]);
      onJobCreated?.(job);
      toast.success(`Created job with ${validPrompts.length} prompts`);
      
      // Reset form
      setPrompts([{
        id: crypto.randomUUID(),
        text: '',
        type: 'video',
        style: 'cinematic',
        tone: 'energetic',
        aspectRatio: '16:9',
        targetPlatform: 'Instagram Reels',
      }]);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create job');
      toast.error('Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'processing': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Veo3 AI Production</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generate multiple AI videos, images, and ads with Claude & Cohere
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            icon={History}
            onClick={() => setShowHistory(!showHistory)}
          >
            History ({jobHistory.length})
          </Button>
          <Button variant="secondary" icon={Settings}>
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Batch Prompt Form */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Title>Batch Generation</Title>
                  <Text className="text-gray-500 dark:text-gray-400">
                    Create multiple prompts for efficient generation
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  icon={Plus}
                  onClick={addPrompt}
                  disabled={prompts.length >= 10}
                >
                  Add Prompt
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {prompts.map((prompt, index) => (
                  <div key={prompt.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Prompt {index + 1}
                      </h3>
                      {prompts.length > 1 && (
                        <Button
                          variant="light"
                          color="red"
                          icon={Trash2}
                          onClick={() => removePrompt(prompt.id)}
                        />
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={prompt.text}
                          onChange={(e) => updatePrompt(prompt.id, 'text', e.target.value)}
                          placeholder="Describe your video, image, or ad idea..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                          </label>
                          <Select
                            value={prompt.type}
                            onValueChange={(value) => updatePrompt(prompt.id, 'type', value)}
                          >
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="ad">Ad</SelectItem>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Style
                          </label>
                          <TextInput
                            value={prompt.style}
                            onChange={(e) => updatePrompt(prompt.id, 'style', e.target.value)}
                            placeholder="cinematic, modern, etc."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tone
                          </label>
                          <TextInput
                            value={prompt.tone}
                            onChange={(e) => updatePrompt(prompt.id, 'tone', e.target.value)}
                            placeholder="energetic, professional, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Aspect Ratio
                          </label>
                          <Select
                            value={prompt.aspectRatio}
                            onValueChange={(value) => updatePrompt(prompt.id, 'aspectRatio', value)}
                          >
                            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Target Platform
                        </label>
                        <TextInput
                          value={prompt.targetPlatform}
                          onChange={(e) => updatePrompt(prompt.id, 'targetPlatform', e.target.value)}
                          placeholder="Instagram Reels, Facebook Ad, etc."
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {error}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || prompts.every(p => !p.text.trim())}
                    icon={loading ? RefreshCw : Sparkles}
                    loading={loading}
                  >
                    {loading ? 'Creating Job...' : `Generate ${prompts.filter(p => p.text.trim()).length} Assets`}
                  </Button>
                </div>
              </form>
            </div>
          </Card>

          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <Title className="mb-4">Active Jobs</Title>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Job {job.id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.prompts.length} prompts • {new Date(job.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge color={getStatusColor(job.status) as any}>
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tips */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <Title>Pro Tips</Title>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Batch Efficiency</h4>
                  <p>Create 3-5 variations of the same concept to test different approaches.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Prompt Quality</h4>
                  <p>Be specific about style, mood, and target audience for better results.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Platform Optimization</h4>
                  <p>Tailor your prompts for specific platforms (Instagram, TikTok, Facebook).</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Templates */}
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <Title className="mb-4">Quick Templates</Title>
              <div className="space-y-2">
                {[
                  'Product showcase with lifestyle shots',
                  'Before/after transformation',
                  'Customer testimonial style',
                  'Behind-the-scenes content',
                  'Educational how-to video'
                ].map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      updatePrompt(prompts[0].id, 'text', template);
                      toast.success('Template applied');
                    }}
                    className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Job History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Title>Generation History</Title>
              <Button variant="light" onClick={() => setShowHistory(false)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-3">
              {jobHistory.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {job.prompts.length} prompts • {job.type}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge color={getStatusColor(job.status) as any}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Title>Job Details</Title>
              <Button variant="light" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Prompts</h3>
                <div className="space-y-2">
                  {selectedJob.prompts.map((prompt, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-sm">{prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedJob.results && selectedJob.results.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Results</h3>
                  <div className="space-y-2">
                    {selectedJob.results.map((result) => (
                      <div key={result.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{result.type}</span>
                          <Button
                            variant="light"
                            size="xs"
                            icon={Copy}
                            onClick={() => copyToClipboard(result.generated_content)}
                          >
                            Copy
                          </Button>
                        </div>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {result.generated_content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 