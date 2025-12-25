# Persistent Container Architecture for Code Execution

## Overview

This implementation uses persistent Docker containers with WebSocket connections for code execution. When the server starts, it launches separate containers for Python, JavaScript, and C++. These containers run continuously and listen for code execution requests via WebSocket.

## Architecture

### Components

1. **Container Manager** (`src/services/containerManager.js`)
   - Builds Docker images for each language
   - Starts and stops containers
   - Manages container lifecycle

2. **WebSocket Executor Service** (`src/services/codeExecutorWSService.js`)
   - Maintains WebSocket connections to containers
   - Sends code execution requests
   - Handles responses and errors

3. **Language Executors** (in `docker/`)
   - `executor-python.py` - Python code executor with WebSocket server
   - `executor-javascript.js` - JavaScript code executor with WebSocket server
   - `executor-cpp.py` - C++ code executor with WebSocket server

### Docker Images

Each language has a persistent Dockerfile:
- `Dockerfile.python.persistent`
- `Dockerfile.javascript.persistent`
- `Dockerfile.cpp.persistent`

These images include:
- Language runtime
- WebSocket server library
- Executor script that listens on port 8765

## How It Works

### Server Startup

1. Server calls `containerManager.startAllContainers()`
2. For each language (Python, JavaScript, C++):
   - Builds the Docker image
   - Creates and starts a container
   - Container starts WebSocket server on port 8765
3. Server begins accepting HTTP requests

### Code Execution Flow

1. Client sends POST request to `/api/code/execute` with:
   ```json
   {
     "code": "print('Hello, World!')",
     "language": "python",
     "input": "optional input data"
   }
   ```

2. Controller receives request and forwards to `codeExecutorWSService`

3. Service:
   - Checks if container is running
   - Gets or creates WebSocket connection to container
   - Sends execution request:
     ```json
     {
       "code": "...",
       "input": "..."
     }
     ```

4. Container executor:
   - Receives the request
   - Executes the code with provided input
   - Sends back response:
     ```json
     {
       "status": "success" | "error",
       "output": "execution output",
       "error": "error message if any"
     }
     ```

5. Service returns result to controller
6. Controller sends HTTP response to client

### Server Shutdown

1. Server receives SIGTERM or SIGINT
2. Closes all WebSocket connections
3. Stops and removes all containers
4. Closes HTTP server

## Benefits

1. **Performance**: No container startup overhead for each execution
2. **Interactive Input**: Full support for stdin input (cin, input(), readline(), etc.)
3. **Resource Efficiency**: Containers are reused, reducing Docker overhead
4. **Isolation**: Each execution still runs in an isolated container environment
5. **Scalability**: Can easily add more containers or languages

## Resource Limits

Each container has:
- Memory: 256MB
- CPU: 50% of one core
- Network: Bridge mode (isolated)
- Execution timeout: 30 seconds per request

## Testing

To test the implementation:

1. Start the server:
   ```bash
   npm run dev
   ```

2. Wait for all containers to start (you'll see "All executor containers are ready")

3. Send a test request:
   ```bash
   curl -X POST http://localhost:5000/api/code/execute \
     -H "Content-Type: application/json" \
     -d '{
       "code": "name = input(\"Enter your name: \")\nprint(f\"Hello, {name}!\")",
       "language": "python",
       "input": "Alice"
     }'
   ```

4. Expected response:
   ```json
   {
     "success": true,
     "data": {
       "output": "Enter your name: Hello, Alice!",
       "error": false,
       "executionTime": "N/A"
     }
   }
   ```

## Troubleshooting

### Containers not starting
- Check Docker is running: `docker ps`
- Check Docker build logs
- Ensure ports are available

### WebSocket connection fails
- Check container logs: `docker logs codehub-python-executor`
- Verify container is running: `docker ps | grep codehub`
- Check firewall settings

### Code execution timeout
- Default timeout is 30 seconds
- Check for infinite loops
- Verify input data format

## Adding New Languages

To add a new language:

1. Create `Dockerfile.{language}.persistent` in `docker/`
2. Create `executor-{language}.{ext}` with WebSocket server
3. Add language to `containerManager.js` arrays
4. Update controller's supported languages list
5. Build and test

## Security Considerations

- Containers run with non-root user
- Network isolation (bridge mode)
- Resource limits enforced
- No internet access from containers
- Code execution timeout limits
