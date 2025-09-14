import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic API routes for the original app
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Listro API is running' });
});

// Products API (placeholder)
app.get('/api/products', (req, res) => {
  res.json({ 
    success: true, 
    data: [
      { id: 1, name: 'Sample Product 1', price: 29.99 },
      { id: 2, name: 'Sample Product 2', price: 49.99 }
    ] 
  });
});

// Analytics API (placeholder)
app.get('/api/analytics', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      totalProducts: 2,
      totalRevenue: 79.98,
      totalOrders: 5
    } 
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Listro API Server running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});