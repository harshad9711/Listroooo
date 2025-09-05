import { useState, useRef, useEffect } from "react";
import { Card, Title, Text } from '@tremor/react';
import { 
  Video, 
  ImageIcon, 
  Pause, 
  Play, 
  X, 
  Copy, 
  DollarSign, 
  Split, 
  AlertCircle, 
  Check, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface TestVariant {
  id: string;
  type: 'image' | 'video';
  content: string | File;
  platform: string;
  impressions: number;
  engagement: number;
  conversions: number;
  adSpend: number;
  revenue: number;
}

interface TestResult {
  winner: TestVariant;
  improvement: number;
  confidence: number;
  roas: number;
}

const mockVariants: TestVariant[] = [
  {
    id: '1',
    type: 'video',
    content: 'https://example.com/video1.mp4',
    platform: 'TikTok Shop',
    impressions: 15000,
    engagement: 2250,
    conversions: 450,
    adSpend: 500,
    revenue: 2250
  },
  {
    id: '2',
    type: 'video',
    content: 'https://example.com/video2.mp4',
    platform: 'TikTok Shop',
    impressions: 14800,
    engagement: 1850,
    conversions: 380,
    adSpend: 500,
    revenue: 1900
  }
];

export default function UGCSplitTester() {
  const [activeTest, setActiveTest] = useState<boolean>(false);
  const [testDuration, setTestDuration] = useState<number>(7);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('tiktok');
  const [contentType, setContentType] = useState<'image' | 'video'>('video');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [variantA, setVariantA] = useState<File | null>(null);
  const [variantB, setVariantB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string>('');
  const [previewB, setPreviewB] = useState<string>('');
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [adSpendA, setAdSpendA] = useState<number>(500);
  const [adSpendB, setAdSpendB] = useState<number>(500);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(50);
  
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/ugc/split-tests`)
      .then(res => res.json())
      .then(() => {
        setLoading(false);
        toast.success('Test created successfully!');
      });
  }, []);

  const handleFileUpload = (variant: 'A' | 'B', file: File) => {
    if (!file) return;

    // Validate file type
    if (contentType === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (contentType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    if (variant === 'A') {
      setVariantA(file);
      setPreviewA(previewUrl);
    } else {
      setVariantB(file);
      setPreviewB(previewUrl);
    }
  };

  const togglePlay = (variant: 'A' | 'B') => {
    if (variant === 'A') {
      if (videoRefA.current) {
        if (isPlayingA) {
          videoRefA.current.pause();
        } else {
          videoRefA.current.play();
        }
        setIsPlayingA(!isPlayingA);
      }
    } else {
      if (videoRefB.current) {
        if (isPlayingB) {
          videoRefB.current.pause();
        } else {
          videoRefB.current.play();
        }
        setIsPlayingB(!isPlayingB);
      }
    }
  };

  const clearVariant = (variant: 'A' | 'B') => {
    if (variant === 'A') {
      setVariantA(null);
      setPreviewA('');
      setIsPlayingA(false);
    } else {
      setVariantB(null);
      setPreviewB('');
      setIsPlayingB(false);
    }
  };

  const startTest = async () => {
    if (!variantA || !variantB) {
      toast.error('Please upload both variants before starting the test');
      return;
    }

    setLoading(true);
    setActiveTest(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate winner
      const [variant1, variant2] = mockVariants;
      const v1Roas = variant1.revenue / variant1.adSpend;
      const v2Roas = variant2.revenue / variant2.adSpend;
      
      const winner = v1Roas > v2Roas ? variant1 : variant2;
      const improvement = Math.abs(v1Roas - v2Roas) * 100;
      
      setTestResult({
        winner,
        improvement,
        confidence: 95,
        roas: Math.max(v1Roas, v2Roas)
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('Split test completed successfully!');
    } catch (error) {
      toast.error('Failed to complete split test');
    } finally {
      setLoading(false);
    }
  };

  const copyResults = () => {
    if (!testResult) return;

    const resultsText = `
      UGC Split Test Results:
      Platform: ${testResult.winner.platform}
      Improvement: ${testResult.improvement.toFixed(1)}%
      Confidence: ${testResult.confidence}%
      
      Winner Metrics:
      Impressions: ${testResult.winner.impressions.toLocaleString()}
      Engagement: ${testResult.winner.engagement.toLocaleString()}
      Conversions: ${testResult.winner.conversions.toLocaleString()}
    `.trim();

    navigator.clipboard.writeText(resultsText);
    toast.success('Results copied to clipboard');
  };

  const renderPreview = (variant: 'A' | 'B') => {
    const file = variant === 'A' ? variantA : variantB;
    const preview = variant === 'A' ? previewA : previewB;
    const isPlaying = variant === 'A' ? isPlayingA : isPlayingB;
    const videoRef = variant === 'A' ? videoRefA : videoRefB;

    if (!file) {
      return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <input
            type="file"
            accept={contentType === 'image' ? 'image/*' : 'video/*'}
            className="hidden"
            onChange={(e) => handleFileUpload(variant, e.target.files?.[0] as File)}
            id={`file-upload-${variant}`}
          />
          <label htmlFor={`file-upload-${variant}`} className="cursor-pointer">
            {contentType === 'video' ? (
              <Video className="h-8 w-8 text-gray-400" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
            <span className="mt-2 block text-sm text-gray-500 dark:text-gray-400">
              Upload {contentType}
            </span>
          </label>
        </div>
      );
    }

    return (
      <div className="relative">
        {contentType === 'image' ? (
          <img
            src={preview}
            alt={`Variant ${variant}`}
            className="aspect-video object-cover rounded-lg"
          />
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              src={preview}
              className="aspect-video object-cover rounded-lg"
              loop
              onClick={() => togglePlay(variant)}
            />
            <button
              onClick={() => togglePlay(variant)}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity"
            >
              {isPlaying ? (
                <Pause className="h-12 w-12 text-white" />
              ) : (
                <Play className="h-12 w-12 text-white" />
              )}
            </button>
          </div>
        )}
        <button
          onClick={() => clearVariant(variant)}
          className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
    );
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title>UGC Split Tester</Title>
            <Text className="text-gray-500 dark:text-gray-400">
              Test and optimize your user-generated content performance
            </Text>
          </div>
          {testResult && (
            <button
              onClick={copyResults}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Results
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Platform
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="form-select"
            >
              <option value="tiktok">TikTok Shop</option>
              <option value="instagram">Instagram Shopping</option>
              <option value="facebook">Facebook Shop</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value as 'image' | 'video');
                setVariantA(null);
                setVariantB(null);
                setPreviewA('');
                setPreviewB('');
              }}
              className="form-select"
            >
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Duration (days)
            </label>
            <select
              value={testDuration}
              onChange={(e) => setTestDuration(parseInt(e.target.value))}
              className="form-select"
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Average Order Value
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={avgOrderValue}
                onChange={(e) => setAvgOrderValue(parseFloat(e.target.value) || 0)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Variant A</h3>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                Control
              </span>
            </div>
            {renderPreview('A')}
            {variantA && (
              <>
                <div className="grid grid-cols-3 gap-4 text-center mt-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">15.2K</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Engagement</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">8.5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Converts</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">2.1%</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad Spend
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adSpendA}
                      onChange={(e) => setAdSpendA(parseFloat(e.target.value) || 0)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Variant B</h3>
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
                Test
              </span>
            </div>
            {renderPreview('B')}
            {variantB && (
              <>
                <div className="grid grid-cols-3 gap-4 text-center mt-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Views</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">14.8K</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Engagement</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">9.2%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Converts</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">2.4%</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad Spend
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adSpendB}
                      onChange={(e) => setAdSpendB(parseFloat(e.target.value) || 0)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!activeTest && (
          <div className="flex justify-center">
            <button
              onClick={startTest}
              disabled={loading || !variantA || !variantB}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Split className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Starting Test...
                </>
              ) : (
                <>
                  <Split className="mr-2 h-4 w-4" />
                  Start Split Test
                </>
              )}
            </button>
          </div>
        )}

        {testResult && (
          <div className="mt-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Test Results</h3>
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {testResult.confidence}% confidence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Winner</h4>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">Variant {testResult.winner.id}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">ROAS</h4>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {testResult.roas.toFixed(2)}x
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Revenue</h4>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  ${testResult.winner.revenue.toLocaleString()}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-purple-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Total Reach</h4>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {(mockVariants[0].impressions + mockVariants[1].impressions).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Performance Metrics</h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Control
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Test
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Difference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ROAS
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(mockVariants[0].revenue / mockVariants[0].adSpend).toFixed(2)}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {(mockVariants[1].revenue / mockVariants[1].adSpend).toFixed(2)}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        +{((mockVariants[1].revenue / mockVariants[1].adSpend) - (mockVariants[0].revenue / mockVariants[0].adSpend)).toFixed(2)}x
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        Cost per Conversion
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${(mockVariants[0].adSpend / mockVariants[0].conversions).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${(mockVariants[1].adSpend / mockVariants[1].conversions).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        -${((mockVariants[0].adSpend / mockVariants[0].conversions) - (mockVariants[1].adSpend / mockVariants[1].conversions)).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}