import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: false, // Try next available port if occupied
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['crypto']
  },
  define: {
    "process.env": process.env,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI components and styling
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-dropdown-menu'],
          
          // Supabase and database
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/postgrest-js'],
          
          // Date and utility libraries
          'utils-vendor': ['date-fns', 'clsx', 'class-variance-authority'],
          
          // Large page components
          'dashboard-pages': [
            './src/pages/EstablishmentDashboard.tsx',
            './src/pages/DoctorDashboard.tsx',
          ],
          
          // Authentication and profile pages
          'auth-pages': [
            './src/pages/Auth.tsx',
            './src/pages/ProfileComplete.tsx',
            './src/pages/SetupProfile.tsx',
          ],
          
          // Search and booking functionality
          'search-booking': [
            './src/pages/EstablishmentSearch.tsx',
            './src/pages/BookingFlow.tsx',
            './src/pages/VacationDetails.tsx',
          ],
        },
      },
    },
  },
}));
