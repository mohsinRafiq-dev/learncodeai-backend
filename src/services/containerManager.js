import Docker from "dockerode";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContainerManager {
  constructor() {
    this.docker = new Docker();
    this.containers = {
      python: null,
      javascript: null,
      cpp: null,
    };
    this.containerNames = {
      python: "learncodeai-python-executor",
      javascript: "learncodeai-javascript-executor",
      cpp: "learncodeai-cpp-executor",
    };
    // Go up two directories from src/services to reach project root, then into docker
    this.dockerDir = path.join(__dirname, "..", "..", "docker");
    this.containerConfigs = {}; // Track successful container configurations
  }

  /**
   * Build Docker image for a language
   */
  async buildImage(language) {
    // Try secure configurations first, fallback to original
    const configs = [
      {
        imageName: `learncodeai-${language}-fallback`,
        dockerfilePath: `Dockerfile.${language}.fallback`,
        description: "secure fallback",
      },
      {
        imageName: `learncodeai-${language}-secure`,
        dockerfilePath: `Dockerfile.${language}.persistent.secure`,
        description: "secure",
      },
      {
        imageName: `learncodeai-${language}-persistent`,
        dockerfilePath: `Dockerfile.${language}.persistent`,
        description: "original",
      },
    ];

    console.log(`Building ${language} image from ${this.dockerDir}...`);

    for (const config of configs) {
      try {
        console.log(
          `Attempting ${config.description} build for ${language}...`
        );
        const { stdout, stderr } = await execAsync(
          `docker build -t ${config.imageName} -f ${config.dockerfilePath} .`,
          { cwd: this.dockerDir, timeout: 180000 }
        );

        if (stderr && !stderr.includes("naming to")) {
          console.log(`Build output: ${stderr}`);
        }

        console.log(
          `${language} ${config.description} image built successfully`
        );
        this.containerConfigs[language] = config.imageName;
        return true;
      } catch (error) {
        console.log(
          `${config.description} build failed for ${language}: ${error.message}`
        );
        if (config === configs[configs.length - 1]) {
          console.error(`All build configurations failed for ${language}`);
          return false;
        }
        console.log(`Trying next configuration for ${language}...`);
      }
    }
    return false;
  }

  /**
   * Start a container for a language
   */
  async startContainer(language) {
    // Use the successful image configuration, fallback to original
    const imageName =
      this.containerConfigs[language] || `learncodeai-${language}-persistent`;
    const containerName = this.containerNames[language];

    try {
      // Check if container already exists
      const existingContainer = this.docker.getContainer(containerName);
      try {
        const info = await existingContainer.inspect();
        if (info.State.Running) {
          console.log(`${language} container already running`);
          this.containers[language] = existingContainer;
          return existingContainer;
        } else {
          // Start existing container
          await existingContainer.start();
          console.log(`${language} container started`);
          this.containers[language] = existingContainer;
          return existingContainer;
        }
      } catch (inspectError) {
        // Container doesn't exist, create new one
      }
    } catch (error) {
      // Container doesn't exist, continue to create
    }

    // Create and start new container with security enhancements
    console.log(`Creating ${language} container with security features...`);
    const container = await this.docker.createContainer({
      Image: imageName,
      name: containerName,
      ExposedPorts: {
        "8765/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "8765/tcp": [{ HostPort: "0" }], // Random port
        },
        Memory: 256 * 1024 * 1024, // 256MB memory limit
        CpuQuota: 50000, // 50% CPU limit
        NetworkMode: "bridge",
        // Security enhancements
        CapDrop: ["ALL"], // Drop all capabilities
        CapAdd: ["SETUID", "SETGID"], // Add only necessary capabilities
        SecurityOpt: ["no-new-privileges:true"], // Prevent privilege escalation
        ReadonlyRootfs: false, // Keep false for compatibility
        Privileged: false, // Ensure not privileged
      },
    });

    await container.start();
    console.log(`${language} container started`);
    this.containers[language] = container;

    // Wait a moment for the WebSocket server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return container;
  }

  /**
   * Get the WebSocket port for a container
   */
  async getContainerPort(language) {
    const container = this.containers[language];
    if (!container) {
      throw new Error(`${language} container not found`);
    }

    const info = await container.inspect();
    const port = info.NetworkSettings.Ports["8765/tcp"][0].HostPort;
    return port;
  }

  /**
   * Get container IP address
   */
  async getContainerIP(language) {
    const container = this.containers[language];
    if (!container) {
      throw new Error(`${language} container not found`);
    }

    const info = await container.inspect();
    return info.NetworkSettings.IPAddress;
  }

  /**
   * Stop a container
   */
  async stopContainer(language) {
    const container = this.containers[language];
    if (!container) {
      console.log(`${language} container not found`);
      return;
    }

    try {
      await container.stop();
      await container.remove();
      console.log(`${language} container stopped and removed`);
      this.containers[language] = null;
    } catch (error) {
      console.error(`Error stopping ${language} container:`, error.message);
    }
  }

  /**
   * Stop all containers
   */
  async stopAllContainers() {
    console.log("Stopping all executor containers...");
    const languages = Object.keys(this.containers);
    await Promise.all(languages.map((lang) => this.stopContainer(lang)));
  }

  /**
   * Start all containers
   */
  async startAllContainers() {
    console.log("Starting executor containers...");
    const languages = ["python", "javascript", "cpp"];

    for (const language of languages) {
      try {
        await this.buildImage(language);
        await this.startContainer(language);
      } catch (error) {
        console.error(`Failed to start ${language} container:`, error.message);
      }
    }

    console.log("All executor containers started successfully");
  }

  /**
   * Check if a container is running
   */
  async isContainerRunning(language) {
    const container = this.containers[language];
    if (!container) return false;

    try {
      const info = await container.inspect();
      return info.State.Running;
    } catch (error) {
      return false;
    }
  }
}

const containerManager = new ContainerManager();
export default containerManager;
