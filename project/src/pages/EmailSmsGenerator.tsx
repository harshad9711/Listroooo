import React, { useState, useEffect } from 'react';
import { Card, Title, Text, Badge, Button, Grid, Col, Metric, Flex, Tab, TabList, TabGroup, TabPanel, TabPanels, Select, SelectItem, TextInput } from '@tremor/react';
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Save, 
  Clock, 
  AlertCircle, 
  Download, 
  Filter, 
  Settings, 
  BarChart2, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw, 
  ImageIcon, 
  Video, 
  Play, 
  Pause 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  emailSmsGen,
  EMAIL_CATEGORIES, 
  SMS_CATEGORIES, 
  EMAIL_VARIABLES, 
  SMS_VARIABLES,
  type EmailTemplate,
  type SmsTemplate,
  type Campaign,
  type CustomerSegment
} from '../services/emailSmsGen';

interface GeneratorForm {
  type: 'email' | 'sms';
  category: string;
  brandName: string;
  productInfo: {
    name: string;
    price: string;
    url: string;
    image: string;
  };
  customPrompt: string;
  targetAudience: string[];
  scheduledDate: string;
}

const EmailSmsGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'templates' | 'campaigns' | 'segments'>('generator');
  const [form, setForm] = useState<GeneratorForm>({
    type: 'email',
    category: 'welcome',
    brandName: '',
    productInfo: {
      name: '',
      price: '',
      url: '',
      image: ''
    },
    customPrompt: '',
    targetAudience: [],
    scheduledDate: ''
  });
  
  const [generatedContent, setGeneratedContent] = useState<{
    subject?: string;
    preview_text?: string;
    content: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<{ emails: EmailTemplate[]; sms: SmsTemplate[] }>({ emails: [], sms: [] });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | SmsTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emailTemplates, smsTemplates, campaignsData, segmentsData] = await Promise.all([
        emailSmsGen.getEmailTemplates(),
        emailSmsGen.getSmsTemplates(),
        emailSmsGen.getCampaigns(),
        emailSmsGen.getCustomerSegments()
      ]);
      
      setTemplates({ emails: emailTemplates, sms: smsTemplates });
      setCampaigns(campaignsData);
      setSegments(segmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleGenerate = async () => {
    if (!form.brandName) {
      alert('Please enter your brand name');
      return;
    }

    setLoading(true);
    try {
      let content;
      if (form.type === 'email') {
        content = await emailSmsGen.generateEmailContent(
          form.category,
          form.brandName,
          form.productInfo.name ? form.productInfo : undefined,
          form.customPrompt
        );
      } else {
        content = await emailSmsGen.generateSmsContent(
          form.category,
          form.brandName,
          form.productInfo.name ? form.productInfo : undefined,
          form.customPrompt
        );
      }
      
      setGeneratedContent(content);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error generating content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!generatedContent) return;

    try {
      if (form.type === 'email') {
        await emailSmsGen.saveEmailTemplate({
          name: `${form.category} - ${form.brandName}`,
          category: form.category as any,
          subject: generatedContent.subject || '',
          preview_text: generatedContent.preview_text || '',
          content: generatedContent.content,
          variables: Object.values(EMAIL_VARIABLES).flat(),
          is_active: true
        });
      } else {
        await emailSmsGen.saveSmsTemplate({
          name: `${form.category} - ${form.brandName}`,
          category: form.category as any,
          content: generatedContent.content,
          variables: Object.values(SMS_VARIABLES).flat(),
          is_active: true
        });
      }
      
      await loadData();
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  const handleCreateCampaign = async () => {
    if (!generatedContent) return;

    try {
      await emailSmsGen.createCampaign({
        name: `${form.type.toUpperCase()} Campaign - ${form.category}`,
        type: form.type,
        template_id: selectedTemplate?.id || '',
        subject: generatedContent.subject,
        content: generatedContent.content,
        target_audience: form.targetAudience,
        scheduled_date: form.scheduledDate || undefined,
        status: 'draft',
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          unsubscribed: 0,
          revenue_generated: 0
        }
      });
      
      await loadData();
      alert('Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'welcome': return <Heart className="h-4 w-4" />;
      case 'abandoned_cart': return <ShoppingCart className="h-4 w-4" />;
      case 'reengagement': return <RefreshCw className="h-4 w-4" />;
      case 'new_drop': return <Bell className="h-4 w-4" />;
      case 'holiday_sale': return <Gift className="h-4 w-4" />;
      case 'back_in_stock': return <CheckCircle className="h-4 w-4" />;
      case 'flash_sale': return <Zap className="h-4 w-4" />;
      case 'loyalty_reward': return <Star className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'draft': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">AI Email & SMS Generator</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create professional, engaging email and SMS campaigns with AI-powered content generation
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={() => setActiveTab('templates')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Templates
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Campaigns
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'generator', name: 'Content Generator', icon: <Sparkles className="h-4 w-4" /> },
            { id: 'templates', name: 'Templates', icon: <Save className="h-4 w-4" /> },
            { id: 'campaigns', name: 'Campaigns', icon: <Send className="h-4 w-4" /> },
            { id: 'segments', name: 'Customer Segments', icon: <Users className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Generator Tab */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate Content</h2>
            
            <div className="space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Type
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setForm({ ...form, type: 'email' })}
                    className={`flex items-center px-4 py-2 rounded-md border ${
                      form.type === 'email'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: 'sms' })}
                    className={`flex items-center px-4 py-2 rounded-md border ${
                      form.type === 'sms'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    SMS
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Campaign Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(form.type === 'email' ? EMAIL_CATEGORIES : SMS_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.name} - {category.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {form.type === 'email' ? EMAIL_CATEGORIES[form.category as keyof typeof EMAIL_CATEGORIES]?.purpose : SMS_CATEGORIES[form.category as keyof typeof SMS_CATEGORIES]?.purpose}
                </p>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={form.brandName}
                  onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                  placeholder="Enter your brand name"
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Product Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Information (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={form.productInfo.name}
                    onChange={(e) => setForm({ ...form, productInfo: { ...form.productInfo, name: e.target.value } })}
                    placeholder="Product name"
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={form.productInfo.price}
                    onChange={(e) => setForm({ ...form, productInfo: { ...form.productInfo, price: e.target.value } })}
                    placeholder="Price"
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <input
                  type="text"
                  value={form.productInfo.url}
                  onChange={(e) => setForm({ ...form, productInfo: { ...form.productInfo, url: e.target.value } })}
                  placeholder="Product URL"
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mt-2"
                />
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={form.customPrompt}
                  onChange={(e) => setForm({ ...form, customPrompt: e.target.value })}
                  placeholder="Add any specific instructions or tone preferences..."
                  rows={3}
                  className="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !form.brandName}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate {form.type === 'email' ? 'Email' : 'SMS'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Content</h2>
              {generatedContent && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(form.type === 'email' ? generatedContent.subject || '' : generatedContent.content)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Save className="mr-1 h-3 w-3" />
                    Save
                  </button>
                </div>
              )}
            </div>

            {generatedContent ? (
              <div className="space-y-4">
                {form.type === 'email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject Line
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                        <p className="text-gray-900 dark:text-gray-100">{generatedContent.subject}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Preview Text
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                        <p className="text-gray-900 dark:text-gray-100">{generatedContent.preview_text}</p>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {form.type === 'email' ? 'Email Content' : 'SMS Content'}
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border max-h-96 overflow-y-auto">
                    {form.type === 'email' ? (
                      <div dangerouslySetInnerHTML={{ __html: generatedContent.content }} />
                    ) : (
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{generatedContent.content}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={handleCreateCampaign}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Create Campaign
                  </button>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No content generated yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Fill out the form and click generate to create your content.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search templates..."
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 sm:text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(EMAIL_CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...templates.emails, ...templates.sms]
              .filter(template => 
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (selectedCategory === 'all' || template.category === selectedCategory)
              )
              .map((template) => (
                <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(template.category)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {template.category.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  
                  {'subject' in template && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Subject: {template.subject}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {'content' in template ? template.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : template.content}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </button>
                    <button
                      onClick={() => copyToClipboard('content' in template ? template.content : template.content)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Marketing Campaigns</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {campaign.type === 'email' ? (
                            <Mail className="h-8 w-8 text-blue-600" />
                          ) : campaign.type === 'sms' ? (
                            <MessageSquare className="h-8 w-8 text-green-600" />
                          ) : (
                            <div className="flex space-x-1">
                              <Mail className="h-6 w-6 text-blue-600" />
                              <MessageSquare className="h-6 w-6 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {campaign.target_audience.length} segments • {campaign.metrics.sent} sent
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1">{campaign.status}</span>
                        </span>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(campaign.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <BarChart3 className="mr-1 h-4 w-4" />
                          {campaign.metrics.opened} opened • {campaign.metrics.clicked} clicked
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <span className="mr-4">Revenue: ${campaign.metrics.revenue_generated}</span>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Customer Segments Tab */}
      {activeTab === 'segments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Segments</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              New Segment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map((segment) => (
              <div key={segment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {segment.customer_count} customers
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {segment.name}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {segment.description}
                </p>
                
                <div className="flex space-x-2">
                  <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Target className="mr-1 h-3 w-3" />
                    Target
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Template Preview: {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {'subject' in selectedTemplate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject Line
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border">
                      <p className="text-gray-900 dark:text-gray-100">{selectedTemplate.subject}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border max-h-96 overflow-y-auto">
                    {'content' in selectedTemplate ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                    ) : (
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedTemplate.content}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => copyToClipboard('content' in selectedTemplate ? selectedTemplate.content : selectedTemplate.content)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Content
                  </button>
                  <button
                    onClick={() => {
                      setForm({
                        ...form,
                        type: 'content' in selectedTemplate ? 'email' : 'sms',
                        category: selectedTemplate.category
                      });
                      setSelectedTemplate(null);
                      setActiveTab('generator');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Use This Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSmsGenerator; 