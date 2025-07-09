import React from "react";


import VideoGenerator from './VideoGenerator';
import Veo3PromptForm from './Veo3PromptForm';

interface Veo3IntegrationProps {
  userId: string;
}

const examplePrompts = [
  {
    title: 'Product Showcase',
    prompt: 'Create a cinematic product showcase for wireless earbuds. Start with a slow-motion close-up of the sleek design, transition to lifestyle shots of people using them while working out, and end with a dynamic 360-degree view of the charging case.',
    style: 'cinematic'
  },
  {
    title: 'Social Media Ad',
    prompt: 'Create an energetic social media ad for a fitness smartwatch. Show quick cuts between people running, swimming, and cycling while wearing the watch. Include dynamic overlays of heart rate and fitness stats. End with a bold product shot and tagline.',
    style: 'social'
  },
  {
    title: 'Brand Story',
    prompt: 'Tell a brand story about sustainable fashion. Begin with scenes of natural materials and traditional craftsmanship, transition to modern sustainable manufacturing processes, and end with satisfied customers wearing the eco-friendly clothing.',
    style: 'documentary'
  }
];

export default function Veo3Integration({ userId }: Veo3IntegrationProps) {
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<typeof examplePrompts[0] | null>(null);

  const handleVideoComplete = (videoUrl: string) => {
    setGeneratedVideoUrl(videoUrl);
  };

  const handleUsePrompt = (prompt: typeof examplePrompts[0]) => {
    setSelectedPrompt(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Veo3 AI Video</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generate professional AI videos for your products
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <History className="h-4 w-4 mr-2" />
            History
          </button>
          <button className="btn-secondary">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt Generator */}
        <div className="lg:col-span-2">
          <Veo3PromptForm onPromptGenerated={(prompt) => {
            // Handle the generated prompt
            console.log('Generated prompt:', prompt);
          }} />
        </div>

        {/* Tips & Guidelines */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-500" />
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

          <Card className="bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-indigo-500" />
                <Title>Tips for Better Results</Title>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Prompt Structure
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• Start with the desired mood/style</li>
                    <li>• Describe key visual elements</li>
                    <li>• Specify camera movements</li>
                    <li>• Include timing preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Best Practices
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <li>• Keep prompts clear and specific</li>
                    <li>• Use descriptive adjectives</li>
                    <li>• Consider your target audience</li>
                    <li>• Test different styles</li>
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>Need more credits?</span>
                    </div>
                    <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                      Contact support →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}