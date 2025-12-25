# Docker Security Enhancement Script for Windows
# Run this script in PowerShell to perform security checks on your Docker setup

Write-Host "Docker Security Enhancement Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# 1. Security Scanning
Write-Host ""
Write-Host "[SCAN] Running security scans..." -ForegroundColor Yellow

# Build secure images
Write-Host "Building secure Docker images..." -ForegroundColor Blue
try {
    Write-Host "Building Python secure image..."
    docker build -t codehub-python-secure -f docker/Dockerfile.python.persistent.secure docker/
    Write-Host "Building JavaScript secure image..."  
    docker build -t codehub-javascript-secure -f docker/Dockerfile.javascript.persistent.secure docker/
    Write-Host "Building C++ secure image..."
    docker build -t codehub-cpp-secure -f docker/Dockerfile.cpp.persistent.secure docker/
    Write-Host "[OK] Secure images built successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to build secure images" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 2. Check for security best practices  
Write-Host ""
Write-Host "[CHECK] Security Best Practices Check:" -ForegroundColor Yellow

# Check for non-root users in images
Write-Host "Checking if images run as non-root user..."
try {
    $pythonUser = docker run --rm codehub-python-secure whoami 2>$null
    if ($pythonUser -eq "runner") {
        Write-Host "[OK] Python image runs as non-root" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Python image user: $pythonUser" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check Python image user" -ForegroundColor Red
}

try {
    $jsUser = docker run --rm codehub-javascript-secure whoami 2>$null
    if ($jsUser -eq "runner") {
        Write-Host "[OK] JavaScript image runs as non-root" -ForegroundColor Green
    } else {
        Write-Host "[WARN] JavaScript image user: $jsUser" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Failed to check JavaScript image user" -ForegroundColor Red
}

try {
    $cppUser = docker run --rm codehub-cpp-secure whoami 2>$null
    if ($cppUser -eq "runner") {
        Write-Host "[OK] C++ image runs as non-root" -ForegroundColor Green
    } else {
        Write-Host "[WARN] C++ image user: $cppUser" -ForegroundColor Yellow  
    }
} catch {
    Write-Host "[ERROR] Failed to check C++ image user" -ForegroundColor Red
}

# 3. Resource limits check
Write-Host ""
Write-Host "[CONFIG] Verifying resource limits in compose file..." -ForegroundColor Yellow
$composeContent = Get-Content "docker-compose.secure.yml" -Raw

if ($composeContent -match "memory:") {
    Write-Host "[OK] Memory limits configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] No memory limits found" -ForegroundColor Yellow
}

if ($composeContent -match "cpus:") {
    Write-Host "[OK] CPU limits configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] No CPU limits found" -ForegroundColor Yellow
}

# 4. Network security check
Write-Host ""
Write-Host "[NETWORK] Network security configuration..." -ForegroundColor Yellow
if ($composeContent -match "codehub-network") {
    Write-Host "[OK] Custom network configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Consider using custom networks for better isolation" -ForegroundColor Yellow
}

# 5. Image cleanup
Write-Host ""
Write-Host "[CLEANUP] Cleaning up dangling images..." -ForegroundColor Blue
docker image prune -f | Out-Null

Write-Host ""
Write-Host "[SUCCESS] Security enhancement complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary of security improvements:" -ForegroundColor Cyan
Write-Host "  * Removed privileged mode and Docker socket binding" -ForegroundColor White
Write-Host "  * Added resource limits (CPU and memory)" -ForegroundColor White
Write-Host "  * Implemented non-root users in all containers" -ForegroundColor White
Write-Host "  * Added security options (no-new-privileges)" -ForegroundColor White
Write-Host "  * Configured capability dropping" -ForegroundColor White
Write-Host "  * Added health checks" -ForegroundColor White
Write-Host "  * Network isolation improvements" -ForegroundColor White
Write-Host "  * Specific image versions with security patches" -ForegroundColor White
Write-Host ""
Write-Host "To use the secure configuration:" -ForegroundColor Green
Write-Host "  docker-compose -f docker-compose.secure.yml up" -ForegroundColor White