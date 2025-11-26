import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks separados para melhor cache
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'charts-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
          'animations-vendor': ['framer-motion'],
        },
      },
    },
    // Otimizações adicionais
    chunkSizeWarningLimit: 500, // Alerta para chunks maiores que 500KB
    minify: 'esbuild', // Minificação mais rápida
    sourcemap: mode === 'development', // Sourcemaps só em dev
    cssCodeSplit: true, // Split de CSS por rota
  },
}));
