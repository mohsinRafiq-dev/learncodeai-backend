
import http from "http";
import app from "../src/app.js";
import containerManager from "../src/services/containerManager.js";
import codeExecutorWSService from "../src/services/codeExecutorWSService.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Start containers before starting the server
async function startServer() {
  try {
    console.log('Starting executor containers...');
    await containerManager.startAllContainers();
    console.log('All executor containers are ready');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');
  
  // Close WebSocket connections
  codeExecutorWSService.closeAllConnections();
  
  // Stop all containers
  await containerManager.stopAllContainers();
  
  // Close HTTP server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start the server
startServer();
