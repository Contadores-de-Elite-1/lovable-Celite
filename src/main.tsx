import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeEnvironment } from "./lib/env-validation";
import { initPerformanceMonitoring } from "./lib/performance";
import { registerServiceWorker } from "./lib/pwa";
// import { initSentry } from "./lib/sentry"; // Install @sentry/react first: npm install @sentry/react
import { initMobileOptimizations } from "./lib/mobile-optimization";

// Validate environment variables before starting the app
initializeEnvironment();

// Initialize performance monitoring
initPerformanceMonitoring();

// Initialize Sentry error tracking (production only)
// Uncomment after installing: npm install @sentry/react
// initSentry();

// Register service worker for PWA
registerServiceWorker((event) => {
  if (event.type === 'update-available') {
    console.log('[PWA] Update available - reload to update');
    // Show toast notification to user (optional)
  }
});

// Initialize mobile optimizations
const mobileInfo = initMobileOptimizations();
console.log('[Main] Mobile info:', mobileInfo);

createRoot(document.getElementById("root")!).render(<App />);
