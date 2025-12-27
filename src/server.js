import http from "http";
import app from "../src/app.js";
import containerManager from "../src/services/containerManager.js";
import codeExecutorWSService from "../src/services/codeExecutorWSService.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Start containers before starting the server
async function startServer() {
  try {
    await containerManager.startAllContainers();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  // Close WebSocket connections
  codeExecutorWSService.closeAllConnections();

  // Stop all containers
  await containerManager.stopAllContainers();

  // Close HTTP server
  server.close(() => {
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.on("error", (error) => {});

// Start the server
startServer();
