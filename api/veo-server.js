import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import veoRoutes from './veo-routes.js';
import veo3Routes from './veo3-routes.js';
import veo3ProductionRoutes from './veo3-production-routes.js';
import circuitBreakerRoutes from './routes/circuitBreakers.js';
import jobCancellationRoutes from './routes/jobCancellation.js';
import shopifyRoutes from './routes/shopify.js';
import attributionRoutes from './routes/attribution.js';
import productCompositionRoutes from './routes/productComposition.js';
import productionRoutes from './routes/production.js';
import edgeRoutes from './routes/edge.js';
import deliveryRoutes from './server/routes/delivery.js';
import governanceRoutes from './server/routes/governance.js';
import queueRoutes from './server/routes/queues.js';
import { resumeJobsOnStartup } from './lib/startupResume.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount Veo routes
app.use('/api/veo', veoRoutes);

// Mount Veo3 routes
app.use('/api/veo3', veo3Routes);

// Mount Veo3 production routes
app.use('/api/veo3', veo3ProductionRoutes);

// Mount Circuit Breaker routes
app.use('/api/circuit-breakers', circuitBreakerRoutes);

// Mount Job Cancellation routes
app.use('/api/veo3/jobs', jobCancellationRoutes);

// Mount Commerce routes
app.use('/api/commerce/shopify', shopifyRoutes);

// Mount Attribution routes
app.use('/api/attrib', attributionRoutes);

// Mount Product Composition routes
app.use('/api/veo3', productCompositionRoutes);

// Mount Production routes
app.use('/api/production', productionRoutes);

// Mount Edge routes
app.use('/', edgeRoutes);

// Mount Server routes
app.use('/api/delivery', deliveryRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/queues', queueRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Veo API Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Veo endpoints: http://localhost:${PORT}/api/veo/*`);
  console.log(`🎬 Veo3 endpoints: http://localhost:${PORT}/api/veo3/*`);
  console.log(`🎬 Veo3 Production: http://localhost:${PORT}/api/veo3/generate`);
  
  // Resume jobs on startup
  try {
    await resumeJobsOnStartup();
    console.log('✅ Job resume process completed');
  } catch (error) {
    console.error('❌ Failed to resume jobs on startup:', error);
  }
});

export default app;
