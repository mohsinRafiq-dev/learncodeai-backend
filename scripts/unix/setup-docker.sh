#!/bin/bash

echo "Setting up CodeHub Docker environment..."

echo "Building Python runtime image..."
docker build -t codehub-python-base -f docker/Dockerfile.python .

echo "Building C++ runtime image..."
docker build -t codehub-cpp-base -f docker/Dockerfile.cpp .

echo "Building JavaScript runtime image..."
docker build -t codehub-javascript-base -f docker/Dockerfile.javascript .

echo "Setup complete! Docker images are ready for code execution."
echo "Available languages: Python, C++, JavaScript"
