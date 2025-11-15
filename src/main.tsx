import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeEnvironment } from "./lib/env-validation";

// Validate environment variables before starting the app
initializeEnvironment();

createRoot(document.getElementById("root")!).render(<App />);
