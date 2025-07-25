import "./index.css";

import { createRoot } from "react-dom/client";

import { initSentry } from "@/lib/sentry";

import App from "./App.tsx";

// Initialize Sentry
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
