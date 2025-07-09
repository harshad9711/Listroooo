import React from "react";


import toast from 'react-hot-toast';

interface Veo3PromptFormProps {
  onPromptGenerated?: (prompt: string) => void;
}

export default function Veo3PromptForm({ onPromptGenerated }: Veo3PromptFormProps) {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState('energetic');
  const [style, setStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [targetPlatform, setTargetPlatform] = useState('Instagram Reels');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [veo3Prompt, setVeo3Prompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVeo3Prompt('');
    setLoading(true);

    try {
      const prompt = await generateVeo3Prompt(idea, {
        tone,
        style,
        aspectRatio,
        targetPlatform,
      });
      
      setVeo3Prompt(prompt);
      onPromptGenerated?.(prompt);
      toast.success('Prompt generated successfully');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompt');
      toast.error('Failed to generate prompt');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!veo3Prompt) return;
    navigator.clipboard.writeText(veo3Prompt);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>Veo3 Prompt Generator</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Generate optimized prompts for your videos
            </Text>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Idea
            </label>
            <textarea
              rows={3}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="E.g., 'A 15 sec social video showing a runner lacing sneakers, emphasize comfort & durability.'"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tone
              </label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. 'luxury', 'energetic'"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Style
              </label>
              <input
                type="text"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. 'cinematic', 'stop-motion'"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="16:9">16:9</option>
                <option value="1:1">1:1</option>
                <option value="9:16">9:16</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Target Platform
              </label>
              <input
                type="text"
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. 'Instagram Reels', 'Facebook Ad'"
              />
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
              type="submit"
              disabled={loading || !idea}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Prompt
                </>
              )}
            </button>
          </div>
        </form>

        {veo3Prompt && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Generated Veo3 Prompt
              </h3>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Copy
              </button>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {veo3Prompt}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}