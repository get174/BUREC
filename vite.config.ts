import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Increase warning limit slightly and provide manual chunking to split vendors
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor_react';
            if (id.includes('lucide-react')) return 'vendor_icons';
            if (id.includes('@supabase')) return 'vendor_supabase';
            if (id.includes('chart.js') || id.includes('apexcharts')) return 'vendor_charts';
            return 'vendor_misc';
          }
        },
      },
    },
  },
});
