import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeEnvironment } from "./lib/env-validation";
import { initPerformanceMonitoring } from "./lib/performance";

// Validate environment variables before starting the app
initializeEnvironment();

// Initialize performance monitoring
initPerformanceMonitoring();

createRoot(document.getElementById("root")!).render(<App />);
