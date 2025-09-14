import { useState, useEffect } from 'react';
import { Card, Title, Text, Button, Badge, ProgressBar, Tabs, TabsList, TabsTrigger, TabsContent } from '@tremor/react';
import { 
  Wand2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  ShoppingBag,
  BarChart3,
  Link,
  Copy
} from 'lucide-react';
import { VeoPromptJSON, VeoGenerationJob, VeoJobStatus } from './types';
import { createDefaultVeoPrompt } from './promptBuilder';
import { PLATFORM_PRESETS } from './presets';
import AssetPicker from './components/AssetPicker';
import PromptForm from './components/PromptForm';
import PromptPreview from './components/PromptPreview';

// =========================
// TYPES
// =========================

interface Store {
  id: string;
  shop_domain: string;
  provider: string;
  installed_at: string;
  last_sync_at?: string;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  url?: string;
  product_variants: ProductVariant[];
  product_media: ProductMedia[];
}

interface ProductVariant {
  id: string;
  title: string;
  price_cents?: number;
  available: boolean;
}

interface ProductMedia {
  id: string;
  url: string;
  alt?: string;
}

interface AttributionMetrics {
  veoJobId: string;
  productTitle: string;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cvr: number;
  rpc: number;
  createdAt: string;
}

export default function VeoStudioPageEnhanced() {
  const [prompt, setPrompt] = useState<VeoPromptJSON>(() => 
    createDefaultVeoPrompt('tiktok')
  );
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<VeoGenerationJob | null>(null);
  const [generationStatus, setGenerationStatus] = useState<VeoJobStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<any>(null);
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);

  // Commerce state
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Attribution state
  const [attributionMetrics, setAttributionMetrics] = useState<AttributionMetrics[]>([]);
  const [trackedLinks, setTrackedLinks] = useState<Record<string, string>>({});

  // Load initial data
  useEffect(() => {
    loadQuotaInfo();
    loadStores();
    loadAttributionMetrics();
  }, []);

  // Load products when store changes
  useEffect(() => {
    if (selectedStore) {
      loadProducts(selectedStore);
    }
  }, [selectedStore]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseConnection) {
        sseConnection.close();
      }
    };
  }, [sseConnection]);

  // =========================
  // COMMERCE FUNCTIONS
  // =========================

  const loadStores = async () => {
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/commerce/shopify/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.data || []);
        if (data.data?.length > 0) {
          setSelectedStore(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadProducts = async (storeId: string) => {
    setIsLoadingProducts(true);
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch(`/api/veo3/products?storeId=${storeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const syncProducts = async () => {
    if (!selectedStore) return;

    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/commerce/shopify/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ storeId: selectedStore })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Synced ${data.productsCount} products`);
        loadProducts(selectedStore);
      }
    } catch (error) {
      console.error('Failed to sync products:', error);
    }
  };

  const composeFromProduct = async () => {
    if (!selectedProduct) return;

    setIsComposing(true);
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/veo3/composeFromProduct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct,
          variantId: selectedVariant,
          platform: prompt.platform,
          goal: 'product awareness'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPrompt(data.data.json);
        setIsValid(true);
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Failed to compose from product:', error);
    } finally {
      setIsComposing(false);
    }
  };

  // =========================
  // ATTRIBUTION FUNCTIONS
  // =========================

  const loadAttributionMetrics = async () => {
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/attrib/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttributionMetrics(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load attribution metrics:', error);
    }
  };

  const createTrackedLink = async (veoJobId: string, productId: string) => {
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/attrib/link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          veoJobId,
          productId,
          campaign: 'veo3_campaign'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTrackedLinks(prev => ({
          ...prev,
          [veoJobId]: data.data.shortUrl
        }));
        return data.data.shortUrl;
      }
    } catch (error) {
      console.error('Failed to create tracked link:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // =========================
  // EXISTING FUNCTIONS (simplified)
  // =========================

  const loadQuotaInfo = async () => {
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/veo3/quota', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuotaInfo(data);
      }
    } catch (error) {
      console.error('Failed to load quota info:', error);
    }
  };

  const generateVideo = async () => {
    if (!isValid) return;

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('testToken') || 'test-token';
      const response = await fetch('/api/veo3/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `idea-${Date.now()}`
        },
        body: JSON.stringify(prompt)
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentJob({
          id: data.jobId,
          status: data.status,
          prompt: prompt,
          createdAt: new Date().toISOString()
        });
        startPolling(data.jobId);
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('testToken') || 'test-token';
        const response = await fetch(`/api/veo3/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setGenerationStatus(data);
          
          if (data.status === 'done' || data.status === 'error') {
            clearInterval(interval);
            setPollingInterval(null);
            
            if (data.status === 'done' && selectedProduct) {
              // Create tracked link for the completed job
              await createTrackedLink(jobId, selectedProduct);
            }
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Veo 3 Studio</h1>
          <p className="text-gray-600">Create cinematic videos with AI</p>
        </div>
        {quotaInfo && (
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div>
                <Text className="text-sm text-gray-600">Daily Quota</Text>
                <Text className="text-lg font-semibold">
                  {quotaInfo.used} / {quotaInfo.limit}
                </Text>
              </div>
              <ProgressBar 
                value={(quotaInfo.used / quotaInfo.limit) * 100} 
                className="w-32"
              />
            </div>
          </Card>
        )}
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Title>Prompt Builder</Title>
              <PromptForm
                prompt={prompt}
                onPromptChange={setPrompt}
                isValid={isValid}
                onValidationChange={setIsValid}
                validationErrors={validationErrors}
                onValidationErrorsChange={setValidationErrors}
              />
            </Card>

            <Card>
              <Title>Preview</Title>
              <PromptPreview prompt={prompt} />
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <Title>Generation</Title>
                <Text>Create your video with AI</Text>
              </div>
              <Button
                onClick={generateVideo}
                disabled={!isValid || isGenerating}
                icon={Wand2}
              >
                {isGenerating ? 'Generating...' : 'Generate Video'}
              </Button>
            </div>

            {currentJob && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="font-medium">Job {currentJob.id}</Text>
                    <Text className="text-sm text-gray-600">
                      Status: {generationStatus?.status || currentJob.status}
                    </Text>
                  </div>
                  {generationStatus?.status === 'done' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        icon={Download}
                        onClick={() => window.open(`/api/veo3/jobs/${currentJob.id}/download`)}
                      >
                        Download
                      </Button>
                      {trackedLinks[currentJob.id] && (
                        <Button
                          size="sm"
                          icon={Copy}
                          onClick={() => copyToClipboard(trackedLinks[currentJob.id])}
                        >
                          Copy Link
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {generationStatus?.progress && (
                  <ProgressBar value={generationStatus.progress} className="mt-2" />
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <Title>Product Catalog</Title>
              <Button onClick={syncProducts} disabled={!selectedStore}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Products
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Text className="text-sm font-medium mb-2">Store</Text>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.shop_domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Text className="text-sm font-medium mb-2">Product</Text>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={!selectedStore || isLoadingProducts}
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div>
                  <Text className="text-sm font-medium mb-2">Variant</Text>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Use first available</option>
                    {products.find(p => p.id === selectedProduct)?.product_variants.map(variant => (
                      <option key={variant.id} value={variant.id}>
                        {variant.title} - ${(variant.price_cents || 0) / 100}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                onClick={composeFromProduct}
                disabled={!selectedProduct || isComposing}
                className="w-full"
              >
                {isComposing ? 'Composing...' : 'Compose from Product'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <Card>
            <Title>Attribution Metrics</Title>
            <Text className="mb-4">Track performance of your video creatives</Text>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Creative</th>
                    <th className="text-left p-2">Product</th>
                    <th className="text-left p-2">Clicks</th>
                    <th className="text-left p-2">Conversions</th>
                    <th className="text-left p-2">Revenue</th>
                    <th className="text-left p-2">CTR</th>
                    <th className="text-left p-2">CVR</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attributionMetrics.map(metric => (
                    <tr key={metric.veoJobId} className="border-b">
                      <td className="p-2">{metric.veoJobId.slice(0, 8)}...</td>
                      <td className="p-2">{metric.productTitle}</td>
                      <td className="p-2">{metric.clicks}</td>
                      <td className="p-2">{metric.conversions}</td>
                      <td className="p-2">${metric.revenue.toFixed(2)}</td>
                      <td className="p-2">{metric.ctr.toFixed(1)}%</td>
                      <td className="p-2">{metric.cvr.toFixed(1)}%</td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          {trackedLinks[metric.veoJobId] && (
                            <Button
                              size="sm"
                              icon={Link}
                              onClick={() => copyToClipboard(trackedLinks[metric.veoJobId])}
                            >
                              Copy Link
                            </Button>
                          )}
                          <Button size="sm" icon={BarChart3}>
                            Iterate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}