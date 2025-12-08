// Vercel serverless function entry point
import { config as loadEnv } from "dotenv";
loadEnv();
import express, { type Request, Response } from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all API routes (without WebSocket server)
let routesRegistered = false;

(async () => {
  if (!routesRegistered) {
    await registerRoutes(app);
    routesRegistered = true;
  }
})();

// Serve static files in production
serveStatic(app);

// Export the Express app as a Vercel serverless function
export default app;