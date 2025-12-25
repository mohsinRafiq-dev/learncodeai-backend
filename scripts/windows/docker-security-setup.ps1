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
    docker build -t codehub-python-secure -f docker/Dockerfile.python.persistent.secure docker/
    docker build -t codehub-javascript-secure -f docker/Dockerfile.javascript.persistent.secure docker/
    docker build -t codehub-cpp-secure -f docker/Dockerfile.cpp.persistent.secure docker/
    Write-Host "[OK] Secure images built successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to build secure images" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 2. Vulnerability scanning (if available)
Write-Host ""
Write-Host "[SHIELD] Scanning for vulnerabilities..." -ForegroundColor Yellow

$dockerScanAvailable = $false
try {
    docker scan --help | Out-Null
    $dockerScanAvailable = $true
} catch {
    Write-Host "[WARNING] Docker scan not available. Consider installing Docker Scout." -ForegroundColor Yellow
}

if ($dockerScanAvailable) {
    try {
        Write-Host "Scanning Python image..."
        docker scan codehub-python-secure
        Write-Host "Scanning JavaScript image..."
        docker scan codehub-javascript-secure
        Write-Host "Scanning C++ image..."
        docker scan codehub-cpp-secure
    } catch {
        Write-Host "⚠️ Security scan completed with findings. Review the output above." -ForegroundColor Yellow
    }
}

# 3. Check for security best practices
Write-Host ""
Write-Host "🔐 Security Best Practices Check:" -ForegroundColor Yellow

# Check for non-root users in images
Write-Host "Checking if images run as non-root user..."
try {
    $pythonUser = docker run --rm codehub-python-secure whoami
    if ($pythonUser -eq "runner") {
        Write-Host "✅ Python image runs as non-root" -ForegroundColor Green
    } else {
        Write-Host "❌ Python image runs as root" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check Python image user" -ForegroundColor Red
}

try {
    $jsUser = docker run --rm codehub-javascript-secure whoami
    if ($jsUser -eq "runner") {
        Write-Host "✅ JavaScript image runs as non-root" -ForegroundColor Green
    } else {
        Write-Host "❌ JavaScript image runs as root" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check JavaScript image user" -ForegroundColor Red
}

try {
    $cppUser = docker run --rm codehub-cpp-secure whoami
    if ($cppUser -eq "runner") {
        Write-Host "✅ C++ image runs as non-root" -ForegroundColor Green
    } else {
        Write-Host "❌ C++ image runs as root" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to check C++ image user" -ForegroundColor Red
}

# 4. Resource limits check
Write-Host ""
Write-Host "📊 Verifying resource limits in compose file..." -ForegroundColor Yellow
$composeContent = Get-Content "docker-compose.secure.yml" -Raw

if ($composeContent -match "memory:") {
    Write-Host "✅ Memory limits configured" -ForegroundColor Green
} else {
    Write-Host "❌ No memory limits found" -ForegroundColor Red
}

if ($composeContent -match "cpus:") {
    Write-Host "✅ CPU limits configured" -ForegroundColor Green
} else {
    Write-Host "❌ No CPU limits found" -ForegroundColor Red
}

# 5. Network security check
Write-Host ""
Write-Host "🌐 Network security configuration..." -ForegroundColor Yellow
if ($composeContent -match "internal: true") {
    Write-Host "✅ Internal network configured" -ForegroundColor Green
} else {
    Write-Host "⚠️ Consider using internal networks for better isolation" -ForegroundColor Yellow
}

# 6. Image cleanup
Write-Host ""
Write-Host "🧹 Cleaning up dangling images..." -ForegroundColor Blue
docker image prune -f

Write-Host ""
Write-Host "🎉 Security enhancement complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of security improvements:" -ForegroundColor Cyan
Write-Host "   • Removed privileged mode and Docker socket binding" -ForegroundColor White
Write-Host "   • Added resource limits (CPU and memory)" -ForegroundColor White
Write-Host "   • Implemented non-root users in all containers" -ForegroundColor White
Write-Host "   • Added security options (no-new-privileges)" -ForegroundColor White
Write-Host "   • Configured capability dropping" -ForegroundColor White
Write-Host "   • Added health checks" -ForegroundColor White
Write-Host "   • Network isolation improvements" -ForegroundColor White
Write-Host "   • Specific image versions with security patches" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To use the secure configuration:" -ForegroundColor Green
Write-Host "   docker-compose -f docker-compose.secure.yml up" -ForegroundColor White