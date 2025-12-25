# CodeHub - Code Execution Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Docker Images](#docker-images)
3. [File Structure & Responsibilities](#file-structure--responsibilities)
4. [Code Execution Flow](#code-execution-flow)
5. [Setup Commands](#setup-commands)

---

## Overview

CodeHub is a secure online code execution platform that allows users to run Python, JavaScript, and C++ code in isolated Docker containers. The system ensures security through containerization, resource limits, and network isolation.

### Key Features:

- **Multi-language Support**: Python, JavaScript, C++
- **Secure Execution**: Each code execution runs in isolated Docker containers
- **Resource Limits**: Memory (128MB) and CPU (0.5 cores) constraints
- **Timeout Protection**: 10-second execution limit
- **Network Isolation**: Containers have no network access
- **Real-time Results**: Instant code execution with output display

---

## Docker Images

### Base Images Overview

| Language   | Base Image           | Size  | Purpose                    |
| ---------- | -------------------- | ----- | -------------------------- |
| Python     | `python:3.11-alpine` | 109MB | Lightweight Python runtime |
| JavaScript | `node:18-alpine`     | 206MB | Node.js runtime            |
| C++        | `gcc:latest`         | 2.2GB | GCC compiler & runtime     |

### Image Details

#### 1. Python Image (`codehub-python-base`)

**Dockerfile**: `docker/Dockerfile.python`

**Features**:

- Based on `python:3.11-alpine` for minimal size
- Non-root `runner` user for security
- Direct Python execution
- File: Creates `main.py` and executes it

#### 2. JavaScript Image (`codehub-javascript-base`)

**Dockerfile**: `docker/Dockerfile.javascript`

**Features**:

- Based on `node:18-alpine`
- Node.js 18 LTS runtime
- Non-root execution
- File: Creates `main.js` and executes with Node

#### 3. C++ Image (`codehub-cpp-base`)

**Dockerfile**: `docker/Dockerfile.cpp`

**Features**:

- Based on `gcc:latest` with full compiler suite
- Runtime compilation and execution
- Proper permission handling for compilation
- File: Creates `main.cpp`, compiles to `main`, then executes

---

## File Structure & Responsibilities

```
codehub-backend/
├── docker/                          # Docker configurations
│   ├── Dockerfile.python           # Python runtime image
│   ├── Dockerfile.javascript        # JavaScript runtime image
│   └── Dockerfile.cpp              # C++ runtime image
├── docs/                           # Documentation
│   ├── CODE_EXECUTION_SETUP.md     # Setup instructions
│   └── CODE_EXECUTION_ARCHITECTURE.md # This file
├── src/
│   ├── app.js                      # Express app configuration
│   ├── server.js                   # Server entry point
│   ├── controllers/
│   │   └── codeExecutionController.js # HTTP request handlers
│   ├── routes/
│   │   └── codeExecutionRoutes.js  # API route definitions
│   ├── services/
│   │   └── codeExecutorService.js  # Core execution logic
│   └── config/
│       └── logger.js               # Logging configuration
├── temp/                           # Temporary file storage
├── setup-docker.bat               # Windows Docker setup
├── setup-docker.sh                # Linux/Mac Docker setup
└── docker-compose.yml             # Container orchestration
```

### Key Files Explained

#### `src/services/codeExecutorService.js`

**Purpose**: Core service handling code execution logic
**Key Methods**:

- `executeCode()`: Main execution orchestrator
- `runInDocker()`: Docker container management
- `getLanguageConfig()`: Language-specific configurations
- `cleanup()`: Temporary file cleanup

#### `src/controllers/codeExecutionController.js`

**Purpose**: HTTP request/response handling
**Responsibilities**:

- Input validation
- Error handling
- Response formatting

#### `src/routes/codeExecutionRoutes.js`

**Purpose**: API endpoint definitions
**Endpoints**:

- `POST /api/code/execute`: Execute code
- `GET /api/code/languages`: Get supported languages

---

## Code Execution Flow

### Step-by-Step Process

1. **Frontend Request**

   - User submits code via POST request to `/api/code/execute`
   - Request includes: code content, language, and optional input

2. **Backend Processing**

   - Route handler receives and validates request
   - Controller validates input parameters
   - Service creates temporary session directory

3. **Docker Container Execution**

   - Create temporary session directory: `temp/session_<timestamp>_<random>`
   - Write code to appropriate file (`main.py`, `main.js`, or `main.cpp`)
   - Build temporary Docker image using language-specific Dockerfile
   - Run container with resource restrictions:
     - Memory limit: 128MB
     - CPU limit: 0.5 cores
     - Network isolation: No network access
     - Timeout: 10 seconds

4. **Result Processing**
   - Capture stdout/stderr output
   - Measure execution time
   - Clean up temporary files and Docker images
   - Return formatted JSON response

---

## Setup Commands

### Prerequisites

```powershell
# Verify Docker installation
docker --version
docker-compose --version

# Verify Node.js installation
node --version
npm --version
```

### Initial Setup

#### 1. Build Docker Images

```powershell
# Windows
cd "C:\Development\CodeHub\codehub-backend"
.\setup-docker.bat

# Or manually build each image
docker build -t codehub-python-base -f docker/Dockerfile.python .
docker build -t codehub-javascript-base -f docker/Dockerfile.javascript .
docker build -t codehub-cpp-base -f docker/Dockerfile.cpp .
```

#### 2. Install Dependencies

```powershell
# Install Node.js packages
npm install

# If PowerShell execution policy issues
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. Start the Backend

```powershell
# Development mode
npm run dev

# Production mode
npm start
```

#### 4. Verify Setup

```powershell
# Check Docker images
docker images

# Test API endpoint
curl -X POST http://localhost:4000/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello World\")", "language":"python"}'
```

### Maintenance Commands

#### Docker Cleanup

```powershell
# Remove orphaned containers
docker container prune

# Remove orphaned images
docker image prune

# Remove all codehub-related images
docker images | Where-Object {$_.Repository -like "*codehub*"} | ForEach-Object {docker rmi $_.ImageId}

# Clean temporary files
Remove-Item -Recurse -Force temp/*
```

#### Rebuild Images

```powershell
# Rebuild single image
docker build --no-cache -t codehub-python-base -f docker/Dockerfile.python .

# Rebuild all images
.\setup-docker.bat
```

---

## Conclusion

The CodeHub code execution system provides a secure, scalable platform for running user code in isolated environments. The Docker-based architecture ensures security while maintaining performance and ease of use.

---

**Last Updated**: September 23, 2025
**Version**: 1.0.0
**Author**: Israr Ahmad (@israrahmad831)
**GitHub**: https://github.com/israrahmad831
