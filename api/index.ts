// Vercel serverless function entry point
import { config as loadEnv } from "dotenv";
loadEnv();
import express from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set VERCEL env to skip WebSocket initialization
process.env.VERCEL = "1";

// Register all API routes and serve static files
// Note: registerRoutes creates an HTTP server, but we ignore it for Vercel
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

async function initializeApp() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        await registerRoutes(app);
        serveStatic(app);
        isInitialized = true;
      } catch (error) {
        console.error("Failed to initialize routes:", error);
        throw error;
      }
    })();
  }
  return initializationPromise;
}

// Middleware to ensure initialization completes before handling requests
app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await initializeApp();
    } catch (error) {
      return res.status(500).json({ error: "Failed to initialize application" });
    }
  }
  next();
});

// Start initialization in background
initializeApp().catch(console.error);

// Export the Express app as a Vercel serverless function
export default app;