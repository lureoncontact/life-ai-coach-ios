import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, setupPWAInstallPrompt } from "./utils/pwa";

// Register PWA
if (import.meta.env.PROD) {
  registerServiceWorker();
  setupPWAInstallPrompt();
}

createRoot(document.getElementById("root")!).render(<App />);
