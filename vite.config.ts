import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // For GitHub Pages deployment
    const base = mode === 'production' ? '/NEW-BMI-UMS/' : '/';
    
    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0', // This allows access from any IP
        // This is the key fix - serve index.html for all routes
        historyApiFallback: true
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false
      }
    };
});
