import { useState, useEffect } from 'react';
import { Card, Title, Text, Metric, Badge, Button, Tab, TabList, TabGroup, TabPanel, TabPanels } from '@tremor/react';
import { 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star,
  Users,
  Zap,
  Target
} from 'lucide-react';
import Veo3ProductionForm from '../components/scanner/Veo3ProductionForm';
import { veo3Production, type Veo3GenerationJob } from '../services/veo3Production';
import { useAuth } from '../contexts/AuthContext';

export default function Veo3Production() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<Veo3GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load analytics and recent jobs in parallel
      const [analyticsData, jobsData] = await Promise.all([
        veo3Production.getAnalytics(),
        veo3Production.getUserJobs(user!.id, 10)
      ]);
      
      setAnalytics(analyticsData);
      setRecentJobs(jobsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (job: Veo3GenerationJob) => {
    setRecentJobs(prev => [job, ...prev.slice(0, 9)]);
    // setActiveTab('monitor'); // This line is removed as per the edit hint
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Zap className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
          <Title>Please log in to access Veo3 Production</Title>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Veo3 AI Production</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate professional videos, images, and ads with AI-powered creativity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge color="indigo" icon={Sparkles}>
            Production Ready
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Text>Total Jobs</Text>
                <Metric>{analytics.totalJobs}</Metric>
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Text>Success Rate</Text>
                <Metric>{analytics.successRate.toFixed(1)}%</Metric>
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <Text>Avg. Processing</Text>
                <Metric>{(analytics.averageProcessingTime / 60).toFixed(1)}m</Metric>
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Text>Avg. Rating</Text>
                <Metric>
                  {analytics.topFeedback.length > 0 
                    ? (analytics.topFeedback.reduce((acc: number, f: any) => acc + (f.rating * f.count), 0) / 
                       analytics.topFeedback.reduce((acc: number, f: any) => acc + f.count, 0)).toFixed(1)
                    : 'N/A'
                  }
                </Metric>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <TabGroup className="space-y-6">
        <TabList className="grid w-full grid-cols-3">
          <Tab value="generate" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Generate</span>
          </Tab>
          <Tab value="monitor" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Monitor</span>
          </Tab>
          <Tab value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel className="space-y-6">
            <Veo3ProductionForm 
              userId={user.id}
              onJobCreated={handleJobCreated}
            />
          </TabPanel>
          <TabPanel className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Title>Recent Jobs</Title>
                    <Text className="text-gray-500 dark:text-gray-400">
                      Monitor your AI generation progress
                    </Text>
                  </div>
                  <Button 
                    variant="secondary" 
                    onClick={loadData}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : recentJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <Text className="text-gray-500 dark:text-gray-400">
                      No jobs yet. Start generating content to see your progress here.
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(job.status)}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {job.type.charAt(0).toUpperCase() + job.type.slice(1)} Generation
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {job.prompts.length} prompts • {new Date(job.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge color={getStatusColor(job.status) as any}>
                            {job.status}
                          </Badge>
                          
                          {job.status === 'completed' && job.results && job.results.length > 0 && (
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => {
                                // Show results modal or navigate to results page
                                console.log('View results:', job.results);
                              }}
                            >
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>
          <TabPanel className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card className="bg-white dark:bg-gray-800">
                <div className="p-6">
                  <Title className="mb-4">Performance Metrics</Title>
                  {analytics ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Text>Success Rate</Text>
                        <Text className="font-medium">{analytics.successRate.toFixed(1)}%</Text>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Average Processing Time</Text>
                        <Text className="font-medium">{(analytics.averageProcessingTime / 60).toFixed(1)} minutes</Text>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Total Jobs Processed</Text>
                        <Text className="font-medium">{analytics.totalJobs}</Text>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Text className="text-gray-500 dark:text-gray-400">No data available</Text>
                    </div>
                  )}
                </div>
              </Card>

              {/* User Feedback */}
              <Card className="bg-white dark:bg-gray-800">
                <div className="p-6">
                  <Title className="mb-4">User Feedback</Title>
                  {analytics && analytics.topFeedback.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topFeedback.map((feedback: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <Text className="font-medium">{feedback.count} reviews</Text>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <Text className="text-gray-500 dark:text-gray-400">No feedback yet</Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Usage Insights */}
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <Title className="mb-4">Usage Insights</Title>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Most Popular</Text>
                    <Text className="font-medium">Video Generation</Text>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Peak Usage</Text>
                    <Text className="font-medium">2-4 PM Daily</Text>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">Avg. Batch Size</Text>
                    <Text className="font-medium">3.2 prompts</Text>
                  </div>
                </div>
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 