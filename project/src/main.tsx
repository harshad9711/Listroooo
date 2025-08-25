import './polyfills';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Add error logging
const root = createRoot(rootElement);

try {
  console.log('Attempting to render app...');
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to render app:', error);
}