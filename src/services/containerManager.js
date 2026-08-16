import Docker from "dockerode";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Readiness states surfaced to the API so callers can tell "warming up" apart
// from "broken". Without this the execute endpoint answered a startup window
// with a confusing Piston 401.
export const READINESS = {
  READY: "ready",
  STARTING: "starting",
  UNAVAILABLE: "unavailable",
};

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

    // Per-language readiness. Starts UNAVAILABLE so a request arriving before
    // startAllContainers() runs is refused rather than silently downgraded.
    this.readiness = {
      python: READINESS.UNAVAILABLE,
      javascript: READINESS.UNAVAILABLE,
      cpp: READINESS.UNAVAILABLE,
    };
  }

  /** Does a usable image already exist locally? */
  async findExistingImage(language) {
    const candidates = [
      `learncodeai-${language}-fallback`,
      `learncodeai-${language}-secure`,
      `learncodeai-${language}-persistent`,
    ];
    for (const imageName of candidates) {
      try {
        await this.docker.getImage(imageName).inspect();
        return imageName;
      } catch {
        // Not present locally; try the next candidate.
      }
    }
    return null;
  }

  /**
   * Build Docker image for a language.
   *
   * Skips the build entirely when an image is already present. Rebuilding on
   * every process restart cost minutes (the C++ image is >2GB) and left code
   * execution falling through to a dead fallback for the whole window.
   * Set REBUILD_EXECUTOR_IMAGES=1 to force a rebuild after changing a
   * Dockerfile.
   */
  async buildImage(language, { force = false } = {}) {
    if (!force && process.env.REBUILD_EXECUTOR_IMAGES !== "1") {
      const existing = await this.findExistingImage(language);
      if (existing) {
        console.log(`Reusing existing ${language} image: ${existing}`);
        this.containerConfigs[language] = existing;
        return true;
      }
    }
    return this.#buildImageFromSource(language);
  }

  async #buildImageFromSource(language) {
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
   * Re-resolve a container by name, discarding whatever we had cached.
   *
   * Containers are published on a randomly-assigned host port, so recreating
   * one moves it. A cached handle then reports the previous port and every
   * connection fails with ECONNRESET while the container is demonstrably
   * healthy.
   */
  async refreshContainer(language) {
    const name = this.containerNames[language];
    try {
      const container = this.docker.getContainer(name);
      const info = await container.inspect();
      if (!info.State.Running) {
        this.readiness[language] = READINESS.UNAVAILABLE;
        return null;
      }
      this.containers[language] = container;
      this.readiness[language] = READINESS.READY;
      return container;
    } catch {
      this.containers[language] = null;
      this.readiness[language] = READINESS.UNAVAILABLE;
      return null;
    }
  }

  /**
   * Get the WebSocket port for a container.
   *
   * Always inspects live rather than caching the port: the cost is one local
   * Docker API call, and the alternative is silently talking to a port that
   * moved.
   */
  async getContainerPort(language) {
    let container = this.containers[language];
    if (!container) {
      container = await this.refreshContainer(language);
      if (!container) throw new Error(`${language} container not found`);
    }

    let info;
    try {
      info = await container.inspect();
    } catch {
      // The handle is stale (container recreated or removed) — re-resolve once.
      container = await this.refreshContainer(language);
      if (!container) throw new Error(`${language} container not found`);
      info = await container.inspect();
    }

    const binding = info.NetworkSettings?.Ports?.["8765/tcp"]?.[0];
    if (!binding?.HostPort) {
      throw new Error(`${language} container has no published port`);
    }
    return binding.HostPort;
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
   * Start all containers.
   *
   * Languages are started in parallel rather than sequentially: they are
   * independent, and serialising them meant python waited behind the multi-GB
   * C++ build before it could serve a single request.
   */
  async startAllContainers() {
    console.log("Starting executor containers...");
    const languages = ["python", "javascript", "cpp"];

    for (const language of languages) {
      this.readiness[language] = READINESS.STARTING;
    }

    await Promise.all(
      languages.map(async (language) => {
        try {
          await this.buildImage(language);
          await this.startContainer(language);
          this.readiness[language] = READINESS.READY;
          console.log(`${language} executor ready`);
        } catch (error) {
          this.readiness[language] = READINESS.UNAVAILABLE;
          console.error(`Failed to start ${language} container:`, error.message);
        }
      })
    );

    const ready = languages.filter((l) => this.readiness[l] === READINESS.READY);
    console.log(`Executor containers ready: ${ready.join(", ") || "none"}`);
  }

  /** Readiness for one language. */
  getReadiness(language) {
    return this.readiness[language] ?? READINESS.UNAVAILABLE;
  }

  /** Readiness for every language, for the health endpoint. */
  getAllReadiness() {
    return { ...this.readiness };
  }

  /**
   * Re-check a container that we believe is ready, so a crashed container is
   * reported honestly rather than trusted from stale state.
   */
  async refreshReadiness(language) {
    if (this.readiness[language] !== READINESS.READY) {
      return this.readiness[language];
    }
    const running = await this.isContainerRunning(language);
    if (!running) {
      this.readiness[language] = READINESS.UNAVAILABLE;
    }
    return this.readiness[language];
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
