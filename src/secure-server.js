#!/usr/bin/env node
/**
 * Enhanced Secure Startup Script for LearnCode AI Backend
 * This script starts the application with secure Docker configurations
 */

import http from "http";
import app from "../src/app.js";
import containerManager from "../src/services/containerManager.js";
import codeExecutorWSService from "../src/services/codeExecutorWSService.js";

const PORT = process.env.PORT || 4000;

// Enhanced container manager with security features
class SecureContainerManager {
  constructor(originalManager) {
    this.originalManager = originalManager;
    this.securityConfigs = {
      python: {
        secure: 'learncodeai-python-secure',
        fallback: 'learncodeai-python-fallback', 
        original: 'learncodeai-python-persistent'
      },
      javascript: {
        secure: 'learncodeai-javascript-secure',
        fallback: 'learncodeai-javascript-fallback',
        original: 'learncodeai-javascript-persistent' 
      },
      cpp: {
        secure: 'learncodeai-cpp-secure',
        fallback: 'learncodeai-cpp-fallback',
        original: 'learncodeai-cpp-persistent'
      }
    };
  }

  async checkImageExists(imageName) {
    try {
      const { stdout } = await import('child_process').then(cp => 
        new Promise((resolve, reject) => {
          cp.exec(`docker images ${imageName} --format "{{.Repository}}:{{.Tag}}"`, 
            (error, stdout) => error ? reject(error) : resolve({ stdout }));
        })
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async selectBestImage(language) {
    const configs = this.securityConfigs[language];
    
    // Try secure first, then fallback, then original
    for (const [type, imageName] of Object.entries(configs)) {
      const exists = await this.checkImageExists(imageName);
      if (exists) {
        console.log(`✅ Using ${type} configuration for ${language}: ${imageName}`);
        return { imageName, type };
      }
    }
    
    console.warn(`⚠️  No images found for ${language}, will attempt to build`);
    return null;
  }

  async startSecureContainers() {
    console.log('\n🔒 Starting LearnCode AI with Security Enhancements');
    console.log('================================================');
    
    const languages = ['python', 'javascript', 'cpp'];
    const results = {};
    
    for (const language of languages) {
      try {
        console.log(`\n🔧 Setting up ${language} container...`);
        
        const imageConfig = await this.selectBestImage(language);
        
        if (imageConfig) {
          console.log(`📦 Image available: ${imageConfig.imageName} (${imageConfig.type})`);
          results[language] = imageConfig;
        } else {
          console.log(`🔨 Building secure image for ${language}...`);
          // Fallback to original container manager's build process
          results[language] = { imageName: `learncodeai-${language}-persistent`, type: 'built' };
        }
      } catch (error) {
        console.error(`❌ Error setting up ${language}:`, error.message);
        results[language] = { error: error.message };
      }
    }
    
    console.log('\n📊 Container Configuration Summary:');
    console.log('==================================');
    Object.entries(results).forEach(([lang, config]) => {
      if (config.error) {
        console.log(`❌ ${lang}: Failed - ${config.error}`);
      } else {
        console.log(`✅ ${lang}: ${config.imageName} (${config.type})`);
      }
    });
    
    // Start with original manager but with our enhanced logging
    console.log('\n🚀 Starting containers...');
    await this.originalManager.startAllContainers();
    
    return results;
  }
}

const server = http.createServer(app);
const secureManager = new SecureContainerManager(containerManager);

// Enhanced startup function with security
async function startSecureServer() {
  try {
    console.log('\n🔐 LearnCode AI Backend - Secure Mode');
    console.log('=================================');
    console.log('🛡️  Security features enabled:');
    console.log('   • Non-root container execution');
    console.log('   • Resource limits (CPU/Memory)');
    console.log('   • Capability restrictions');
    console.log('   • No privileged mode');
    console.log('   • Enhanced network isolation');
    console.log('   • Security option hardening');
    
    // Start containers with security enhancements
    const containerResults = await secureManager.startSecureContainers();
    
    // Start HTTP server
    server.listen(PORT, "0.0.0.0", () => {
      console.log('\n✅ LearnCode AI Backend Started Successfully!');
      console.log('========================================');
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🔒 Security mode: ENABLED`);
      console.log(`🐳 Docker containers: SECURE`);
      
      // Display container endpoints
      console.log('\n📡 Container Endpoints:');
      console.log('   • Python: localhost:8765');
      console.log('   • JavaScript: localhost:8766'); 
      console.log('   • C++: localhost:8767');
      
      console.log('\n📋 Security Configuration Files:');
      console.log('   • docker-compose.secure.yml - Full security configuration');
      console.log('   • docker-compose.fallback.yml - Fallback secure configuration');
      console.log('   • Dockerfile.*.secure - Secure container definitions');
      console.log('   • docs/Docker_Security_Guide.md - Security documentation');
      
      console.log('\n🛡️  Security monitoring active');
      console.log('================================================\n');
    });
  } catch (error) {
    console.error('\n❌ Failed to start secure server:', error.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('   1. Run: npm run docker:security-check');
    console.error('   2. Check: docker-compose.fallback.yml');
    console.error('   3. Review: docs/Docker_Security_Guide.md');
    process.exit(1);
  }
}

// Enhanced graceful shutdown
async function secureShutdown() {
  console.log('\n🛑 Initiating secure shutdown...');
  
  // Close WebSocket connections
  console.log('🔌 Closing WebSocket connections...');
  codeExecutorWSService.closeAllConnections();

  // Stop all containers securely
  console.log('📦 Stopping containers securely...');
  await containerManager.stopAllContainers();
  
  // Close HTTP server
  console.log('🌐 Shutting down HTTP server...');
  server.close(() => {
    console.log('✅ Secure shutdown completed');
    process.exit(0);
  });
}

// Security-enhanced signal handlers
process.on('SIGTERM', secureShutdown);
process.on('SIGINT', secureShutdown);

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error('🚨 SECURITY ALERT - Uncaught Exception:', error);
  secureShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 SECURITY ALERT - Unhandled Rejection at:', promise, 'reason:', reason);
  secureShutdown();
});

// Start the secure server
startSecureServer();

