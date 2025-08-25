import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API requests to the API server
app.use('/api', (req, res) => {
  // Redirect to the actual API server
  res.redirect(`http://localhost:3001${req.url}`);
});

// Catch-all handler for React routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend Server running on port ${PORT}`);
  console.log(`🔌 API requests proxied to port 3001`);
  console.log(`📱 Access your app at: http://localhost:${PORT}`);
});
