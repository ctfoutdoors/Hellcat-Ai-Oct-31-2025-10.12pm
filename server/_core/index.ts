import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startMeetingCompletionPoller } from "../services/meetingCompletionPoller";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Diagnostic endpoint to check environment variables
  app.get("/api/check-env", async (req, res) => {
    const shipstationVars = Object.keys(process.env)
      .filter(key => key.toLowerCase().includes('ship'))
      .reduce((obj, key) => {
        obj[key] = process.env[key] ? '✓ Set (hidden)' : '✗ Not set';
        return obj;
      }, {} as Record<string, string>);
    
    res.json({
      shipstationVars,
      count: Object.keys(shipstationVars).length,
      allEnvCount: Object.keys(process.env).length,
    });
  });
  
  // Test endpoint for ShipStation sync (admin only)
  app.get("/api/test-sync", async (req, res) => {
    try {
      const { syncOrdersFromShipStation } = await import('../db-shipstation-sync');
      console.log('\n=== Starting ShipStation Sync Test ===\n');
      
      const result = await syncOrdersFromShipStation(30);
      
      console.log('\n=== Sync Complete ===');
      console.log('Orders Processed:', result.ordersProcessed);
      console.log('Orders Created:', result.ordersCreated);
      console.log('Orders Updated:', result.ordersUpdated);
      console.log('Errors:', result.errors.length);
      
      if (result.errors.length > 0) {
        console.log('\nError Details:');
        result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      }
      
      res.json({
        success: result.success,
        message: 'Sync completed',
        result,
      });
    } catch (error) {
      console.error('\n=== Sync Failed ===');
      console.error('Error:', error);
      
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.stack : String(error),
      });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start meeting completion poller
    startMeetingCompletionPoller();
  });
}

startServer().catch(console.error);
