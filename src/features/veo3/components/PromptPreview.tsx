import { useState } from 'react';
import { Card, Title, Text, Button, Badge, Tab, TabList, TabGroup, TabPanel, TabPanels } from '@tremor/react';
import { Copy, Check, FileJson, Type, Settings } from 'lucide-react';
import { VeoPromptJSON } from '../types';
import { buildVeoPrompt } from '../promptBuilder';

interface PromptPreviewProps {
  prompt: VeoPromptJSON;
  isValid: boolean;
}

export default function PromptPreview({ prompt, isValid }: PromptPreviewProps) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const { promptString, config } = buildVeoPrompt(prompt);

  const copyToClipboard = async (text: string, type: 'json' | 'prompt') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'json') {
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
      } else {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Title className="flex items-center space-x-2">
          <Type className="w-5 h-5" />
          <span>Prompt Preview</span>
        </Title>
        <div className="flex items-center space-x-2">
          <Badge color={isValid ? "green" : "red"}>
            {isValid ? "Valid" : "Invalid"}
          </Badge>
        </div>
      </div>

      <TabGroup>
        <TabList>
          <Tab icon={FileJson}>JSON Structure</Tab>
          <Tab icon={Type}>Veo Prompt</Tab>
          <Tab icon={Settings}>Config</Tab>
        </TabList>
        
        <TabPanels>
          {/* JSON Structure Tab */}
          <TabPanel>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text className="font-medium">Structured JSON Prompt</Text>
                <Button
                  onClick={() => copyToClipboard(formatJson(prompt), 'json')}
                  variant="light"
                  size="sm"
                  icon={copiedJson ? Check : Copy}
                >
                  {copiedJson ? "Copied!" : "Copy JSON"}
                </Button>
              </div>
              
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{formatJson(prompt)}</pre>
              </div>
            </div>
          </TabPanel>

          {/* Veo Prompt Tab */}
          <TabPanel>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text className="font-medium">Generated Veo Prompt String</Text>
                <Button
                  onClick={() => copyToClipboard(promptString, 'prompt')}
                  variant="light"
                  size="sm"
                  icon={copiedPrompt ? Check : Copy}
                >
                  {copiedPrompt ? "Copied!" : "Copy Prompt"}
                </Button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Text className="whitespace-pre-wrap font-mono text-sm">
                  {promptString}
                </Text>
              </div>
            </div>
          </TabPanel>

          {/* Config Tab */}
          <TabPanel>
            <div className="space-y-4">
              <Text className="font-medium">Veo Configuration</Text>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Text className="text-sm font-medium text-gray-600">Aspect Ratio</Text>
                  <Badge color="blue">{config.aspectRatio}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Text className="text-sm font-medium text-gray-600">Resolution</Text>
                  <Badge color="green">{config.resolution}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Text className="text-sm font-medium text-gray-600">Seed</Text>
                  <Text className="font-mono">{config.seed}</Text>
                </div>
                
                <div className="space-y-2">
                  <Text className="text-sm font-medium text-gray-600">Duration</Text>
                  <Text>{prompt.durationSec}s</Text>
                </div>
              </div>

              <div className="space-y-2">
                <Text className="text-sm font-medium text-gray-600">Negative Prompt</Text>
                <div className="bg-gray-50 p-3 rounded border">
                  <Text className="text-sm">{config.negativePrompt}</Text>
                </div>
              </div>

              <div className="space-y-2">
                <Text className="text-sm font-medium text-gray-600">Platform</Text>
                <Badge color="purple">{prompt.platform}</Badge>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Generation Readiness */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
          <Text className="font-medium">
            {isValid ? "Ready for generation" : "Please fix validation errors"}
          </Text>
        </div>
        {isValid && (
          <Text className="text-sm text-gray-600 mt-1">
            Your prompt is properly structured and ready to be sent to Veo 3 for video generation.
          </Text>
        )}
      </div>
    </Card>
  );
}
