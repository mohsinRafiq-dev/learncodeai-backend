# Docker Network Troubleshooting and Security Solution
# This script addresses network connectivity issues and implements security

Write-Host "Docker Network Troubleshooting & Security" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check Docker daemon status
Write-Host ""
Write-Host "[CHECKING] Docker daemon status..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker daemon is running" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Docker daemon not accessible: $dockerInfo" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Cannot check Docker status" -ForegroundColor Red
    exit 1
}

# Network connectivity tests
Write-Host ""
Write-Host "[TESTING] Network connectivity..." -ForegroundColor Yellow

# Test DNS resolution
try {
    $dnsTest = Resolve-DnsName "registry-1.docker.io" -ErrorAction Stop
    Write-Host "[OK] DNS resolution working for registry-1.docker.io" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] DNS resolution failed for Docker registry" -ForegroundColor Red
    Write-Host "[INFO] This could be the cause of your TLS handshake timeout" -ForegroundColor Yellow
}

# Test HTTPS connectivity to Docker Hub
Write-Host "[TESTING] HTTPS connectivity to Docker Hub..." -ForegroundColor Blue
try {
    $webTest = Invoke-WebRequest -Uri "https://registry-1.docker.io/v2/" -UseBasicParsing -TimeoutSec 10
    Write-Host "[OK] Docker Hub registry accessible" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Cannot reach Docker Hub registry" -ForegroundColor Red
    Write-Host "[INFO] Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "[SOLUTION] Trying alternative approaches..." -ForegroundColor Blue
}

# Check for proxy settings
Write-Host ""
Write-Host "[CHECKING] Proxy configuration..." -ForegroundColor Yellow
$proxySettings = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -ErrorAction SilentlyContinue
if ($proxySettings -and $proxySettings.ProxyEnable -eq 1) {
    Write-Host "[INFO] Proxy detected - this might cause Docker connectivity issues" -ForegroundColor Yellow
    Write-Host "[SOLUTION] Configure Docker to use proxy or bypass it" -ForegroundColor Blue
} else {
    Write-Host "[OK] No proxy configuration detected" -ForegroundColor Green
}

# Alternative solution: Use locally available images or different registry
Write-Host ""
Write-Host "[SOLUTION] Implementing fallback strategies..." -ForegroundColor Blue

# Check if images are already available locally
Write-Host "Checking for locally available base images..."
$pythonImages = docker images python --format "table {{.Repository}}:{{.Tag}}" 2>$null | Select-String "python"
$nodeImages = docker images node --format "table {{.Repository}}:{{.Tag}}" 2>$null | Select-String "node"
$gccImages = docker images gcc --format "table {{.Repository}}:{{.Tag}}" 2>$null | Select-String "gcc"

if ($pythonImages) {
    Write-Host "[OK] Python images available locally:" -ForegroundColor Green
    $pythonImages | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "[INFO] No Python images available locally" -ForegroundColor Yellow
}

if ($nodeImages) {
    Write-Host "[OK] Node.js images available locally:" -ForegroundColor Green  
    $nodeImages | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "[INFO] No Node.js images available locally" -ForegroundColor Yellow
}

if ($gccImages) {
    Write-Host "[OK] GCC images available locally:" -ForegroundColor Green
    $gccImages | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "[INFO] No GCC images available locally" -ForegroundColor Yellow
}

# Create fallback Dockerfiles using available images
Write-Host ""
Write-Host "[CREATING] Fallback secure Dockerfiles..." -ForegroundColor Blue

# Create Python fallback using any available Python image
$pythonFallback = @"
# Fallback Python Dockerfile using local image
FROM python:3.11-slim

# Security: Create non-root user first  
RUN groupadd -r runner && useradd -r -g runner -d /app -s /sbin/nologin runner

WORKDIR /app

# Security: Update packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install websockets with retry logic
RUN pip install --no-cache-dir --retries 5 --timeout 30 websockets || \
    pip install --no-cache-dir --index-url https://pypi.python.org/simple/ websockets

# Copy executor script
COPY --chown=runner:runner executor-python.py /app/executor.py
RUN chmod 555 /app/executor.py

# Create restricted temp directory
RUN mkdir -p /app/temp && \
    chown runner:runner /app/temp && \
    chmod 700 /app/temp

USER runner
EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import socket; s=socket.socket(); s.connect(('localhost', 8765)); s.close()" || exit 1

CMD ["python", "/app/executor.py"]
"@

$pythonFallback | Out-File -FilePath "docker\Dockerfile.python.fallback" -Encoding UTF8

# Create Node.js fallback
$nodeFallback = @"
# Fallback Node.js Dockerfile
FROM node:18-slim

# Security: Create non-root user first
RUN groupadd -r runner && useradd -r -g runner -d /app -s /sbin/nologin runner

WORKDIR /app

# Update packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies
COPY --chown=runner:runner package*.json ./
RUN npm install --only=production --timeout=60000 || npm install ws

# Copy executor script
COPY --chown=runner:runner executor-javascript.js /app/executor.js
RUN chmod 555 /app/executor.js

# Create restricted temp directory
RUN mkdir -p /app/temp && \
    chown runner:runner /app/temp && \
    chmod 700 /app/temp

USER runner
EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const net=require('net'); const s=net.createConnection(8765,'localhost'); s.on('connect',()=>process.exit(0)); s.on('error',()=>process.exit(1))"

CMD ["node", "/app/executor.js"]
"@

$nodeFallback | Out-File -FilePath "docker\Dockerfile.javascript.fallback" -Encoding UTF8

Write-Host "[OK] Fallback Dockerfiles created" -ForegroundColor Green

# Try building with fallback Dockerfiles
Write-Host ""
Write-Host "[BUILDING] Attempting to build with fallback images..." -ForegroundColor Blue

try {
    Write-Host "Building Python fallback image..."
    docker build -t codehub-python-fallback -f docker/Dockerfile.python.fallback docker/ 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Python fallback image built successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Python fallback build failed" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Exception during Python build: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "Building Node.js fallback image..." 
    docker build -t codehub-javascript-fallback -f docker/Dockerfile.javascript.fallback docker/ 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] JavaScript fallback image built successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] JavaScript fallback build failed" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Exception during JavaScript build: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "[SOLUTIONS] Recommended actions for TLS handshake timeout:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Network Configuration:" -ForegroundColor Yellow
Write-Host "   - Check Windows Firewall settings" -ForegroundColor White
Write-Host "   - Verify antivirus isn't blocking Docker" -ForegroundColor White  
Write-Host "   - Configure Docker Desktop proxy settings if behind corporate firewall" -ForegroundColor White
Write-Host ""
Write-Host "2. Docker Configuration:" -ForegroundColor Yellow
Write-Host "   - Restart Docker Desktop" -ForegroundColor White
Write-Host "   - Reset Docker to factory defaults if issues persist" -ForegroundColor White
Write-Host "   - Try switching Docker's DNS settings" -ForegroundColor White
Write-Host ""
Write-Host "3. Alternative Registries:" -ForegroundColor Yellow
Write-Host "   - Use mirror registries (Docker China, etc.)" -ForegroundColor White
Write-Host "   - Configure private registry" -ForegroundColor White
Write-Host ""
Write-Host "4. Offline Development:" -ForegroundColor Yellow
Write-Host "   - Pre-pull images when connection is stable" -ForegroundColor White
Write-Host "   - Use local image builds" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "- Use fallback Dockerfiles: docker-compose -f docker-compose.fallback.yml up" -ForegroundColor White
Write-Host "- Or fix network issues and retry with secure configuration" -ForegroundColor White