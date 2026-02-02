// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Simulates a browser environment
    globals: true,        // Allows using describe/it/expect without imports
  },
} as any); // "as any" is a quick fix for TS type merging issues with Vitest