import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['cohere-ai', 'buffer'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {
          global: 'globalThis',
        },
      },
    },
  },
  ssr: {
    external: [
      '@google-cloud/bigquery',
      '@google-cloud/analytics-data',
      '@google-cloud/automl',
      '@google-cloud/aiplatform',
      '@google-cloud/vision',
      '@google-cloud/speech',
      '@google-cloud/translate',
      '@aws-sdk/client-polly',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util',
      '@tensorflow/tfjs',
      '@mediapipe/tasks-vision',
      '@mediapipe/tasks-audio'
    ]
  }
});