#!/bin/bash

# Docker Security Scanning and Hardening Script
# Run this script to perform security checks on your Docker setup

set -e

echo "🔒 Docker Security Enhancement Script"
echo "===================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# 1. Security Scanning
echo ""
echo "🔍 Running security scans..."

# Build secure images
echo "Building secure Docker images..."
docker build -t codehub-python-secure -f docker/Dockerfile.python.persistent.secure docker/
docker build -t codehub-javascript-secure -f docker/Dockerfile.javascript.persistent.secure docker/
docker build -t codehub-cpp-secure -f docker/Dockerfile.cpp.persistent.secure docker/

# 2. Vulnerability scanning (if docker scan is available)
echo ""
echo "🛡️ Scanning for vulnerabilities..."
if command -v docker scan &> /dev/null; then
    echo "Scanning Python image..."
    docker scan codehub-python-secure || echo "⚠️ Docker scan not available or found issues"
    
    echo "Scanning JavaScript image..."
    docker scan codehub-javascript-secure || echo "⚠️ Docker scan not available or found issues"
    
    echo "Scanning C++ image..."
    docker scan codehub-cpp-secure || echo "⚠️ Docker scan not available or found issues"
else
    echo "⚠️ Docker scan not available. Consider installing Docker Scout for vulnerability scanning."
fi

# 3. Check for security best practices
echo ""
echo "🔐 Security Best Practices Check:"

# Check for non-root users in images
echo "Checking if images run as non-root user..."
docker run --rm codehub-python-secure whoami | grep -q "runner" && echo "✅ Python image runs as non-root" || echo "❌ Python image runs as root"
docker run --rm codehub-javascript-secure whoami | grep -q "runner" && echo "✅ JavaScript image runs as non-root" || echo "❌ JavaScript image runs as root"
docker run --rm codehub-cpp-secure whoami | grep -q "runner" && echo "✅ C++ image runs as non-root" || echo "❌ C++ image runs as root"

# 4. Resource limits check
echo ""
echo "📊 Verifying resource limits in compose file..."
if grep -q "memory:" docker-compose.secure.yml; then
    echo "✅ Memory limits configured"
else
    echo "❌ No memory limits found"
fi

if grep -q "cpus:" docker-compose.secure.yml; then
    echo "✅ CPU limits configured"
else
    echo "❌ No CPU limits found"
fi

# 5. Network security check
echo ""
echo "🌐 Network security configuration..."
if grep -q "internal: true" docker-compose.secure.yml; then
    echo "✅ Internal network configured"
else
    echo "⚠️ Consider using internal networks for better isolation"
fi

# 6. Image cleanup
echo ""
echo "🧹 Cleaning up dangling images..."
docker image prune -f

echo ""
echo "🎉 Security enhancement complete!"
echo ""
echo "📋 Summary of security improvements:"
echo "   • Removed privileged mode and Docker socket binding"
echo "   • Added resource limits (CPU and memory)"
echo "   • Implemented non-root users in all containers"
echo "   • Added security options (no-new-privileges)"
echo "   • Configured capability dropping"
echo "   • Added health checks"
echo "   • Network isolation improvements"
echo "   • Specific image versions with security patches"
echo ""
echo "🚀 To use the secure configuration:"
echo "   docker-compose -f docker-compose.secure.yml up"