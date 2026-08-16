import http from "http";
import app from "../src/app.js";
import containerManager from "../src/services/containerManager.js";
import codeExecutorWSService from "../src/services/codeExecutorWSService.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Start containers before starting the server
async function startServer() {
  try {
    const execBackend = (process.env.CODE_EXEC_BACKEND || 'docker').toLowerCase();

    if (execBackend === 'docker') {
      // Local dev: try to start Docker containers (non-blocking)
      try {
        await Promise.race([
          containerManager.startAllContainers(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Docker startup timeout')), 15000)
          )
        ]);
        console.log('✅ Docker containers initialized successfully');
      } catch (dockerError) {
        console.warn(`⚠️  Docker initialization failed: ${dockerError.message}`);
        console.warn('📝 Fallback code executor will be used (Python, JavaScript only)');
      }
    } else {
      console.log(`⚙️  Code execution backend: ${execBackend} (skipping Docker init)`);
    }

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ All routes initialized and ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  // Close our WebSocket connections to the executors.
  codeExecutorWSService.closeAllConnections();

  // The executor containers are deliberately LEFT RUNNING.
  //
  // stopAllContainers() stops and *removes* them, so every deploy destroyed all
  // three and the next boot had to recreate them — on new random host ports,
  // and unavailable for the seconds it took their WebSocket servers to listen.
  // That was the whole cause of code execution breaking after a restart.
  //
  // They are long-lived sandboxes with no state worth reclaiming, so leaving
  // them up means a restart reconnects immediately. Set
  // STOP_EXECUTORS_ON_SHUTDOWN=1 to restore the old behaviour when you actually
  // want a clean slate (e.g. after changing a Dockerfile).
  if (process.env.STOP_EXECUTORS_ON_SHUTDOWN === "1") {
    await containerManager.stopAllContainers();
  }

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
