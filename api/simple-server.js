import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import veoRoutes from './veo-routes.js';
import veo3Routes from './veo3-routes.js';
import veo3ProductionRoutes from './veo3-production-routes.js';

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

// Internal ping endpoint
app.get('/internal/ping', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Veo 3 Production API'
  });
});

// Mount Veo routes
app.use('/api/veo', veoRoutes);

// Mount Veo3 routes
app.use('/api/veo3', veo3Routes);

// Mount Veo3 production routes
app.use('/api/veo3', veo3ProductionRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Veo 3 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Veo 3 API: http://localhost:${PORT}/api/veo3`);
});

export default app;
