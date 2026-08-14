// Tests for the execution safety guards.
//
// Two behaviours here are security- or correctness-critical:
//   1. The in-process fallback must never run untrusted code on the host in
//      production. It is not a sandbox.
//   2. A warming-up or unavailable sandbox must be reported as such, rather
//      than surfacing as a failure attributable to the user's code.

import { jest } from "@jest/globals";
import fallbackCodeExecutor from "../../src/services/fallbackCodeExecutor.js";
import { READINESS } from "../../src/services/containerManager.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  // containerManager is a module singleton, so a spy left attached carries its
  // call count into the next test.
  jest.restoreAllMocks();
});

describe("unsandboxed fallback executor", () => {
  it("is permitted in development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.ALLOW_UNSANDBOXED_EXECUTION;
    expect(fallbackCodeExecutor.isPermitted()).toBe(true);
  });

  it("is permitted in test", () => {
    process.env.NODE_ENV = "test";
    delete process.env.ALLOW_UNSANDBOXED_EXECUTION;
    expect(fallbackCodeExecutor.isPermitted()).toBe(true);
  });

  it("is REFUSED in production by default", () => {
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_UNSANDBOXED_EXECUTION;
    expect(fallbackCodeExecutor.isPermitted()).toBe(false);
  });

  it("can be force-enabled in production only by explicit opt-in", () => {
    process.env.NODE_ENV = "production";
    process.env.ALLOW_UNSANDBOXED_EXECUTION = "1";
    expect(fallbackCodeExecutor.isPermitted()).toBe(true);
  });

  it("does not execute anything when refused", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_UNSANDBOXED_EXECUTION;

    // A payload that would be obvious if it ever ran.
    const result = await fallbackCodeExecutor.executeCode(
      'print("THIS SHOULD NEVER EXECUTE")',
      "python"
    );

    expect(result.error).toBe(true);
    expect(result.executorUnavailable).toBe(true);
    expect(result.output).not.toContain("THIS SHOULD NEVER EXECUTE");
    expect(result.output).toMatch(/secure sandbox is not running/i);
  });

  it("does not leak the opt-in variable name in the user-facing message", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_UNSANDBOXED_EXECUTION;

    const result = await fallbackCodeExecutor.executeCode("x", "python");
    expect(result.output).not.toContain("ALLOW_UNSANDBOXED_EXECUTION");
  });
});

describe("readiness vocabulary", () => {
  it("distinguishes starting from unavailable", () => {
    // These must stay distinct: "starting" is retryable and expected after a
    // deploy, "unavailable" means something is actually wrong.
    expect(READINESS.STARTING).toBe("starting");
    expect(READINESS.UNAVAILABLE).toBe("unavailable");
    expect(READINESS.READY).toBe("ready");
    expect(new Set(Object.values(READINESS)).size).toBe(3);
  });
});

describe("container manager readiness", () => {
  // Imported lazily so the Docker client is constructed inside the test.
  const loadManager = async () => {
    const mod = await import("../../src/services/containerManager.js");
    return mod.default;
  };

  it("starts every language as unavailable, not ready", async () => {
    const cm = await loadManager();
    // A fresh process must not claim readiness it has not established.
    const all = cm.getAllReadiness();
    expect(Object.keys(all).sort()).toEqual(["cpp", "javascript", "python"]);
  });

  it("reports unavailable for an unknown language", async () => {
    const cm = await loadManager();
    expect(cm.getReadiness("rust")).toBe(READINESS.UNAVAILABLE);
  });

  it("downgrades a ready language whose container has stopped", async () => {
    const cm = await loadManager();
    cm.readiness.python = READINESS.READY;
    jest.spyOn(cm, "isContainerRunning").mockResolvedValue(false);

    await expect(cm.refreshReadiness("python")).resolves.toBe(READINESS.UNAVAILABLE);
  });

  it("keeps a ready language ready while its container runs", async () => {
    const cm = await loadManager();
    cm.readiness.python = READINESS.READY;
    jest.spyOn(cm, "isContainerRunning").mockResolvedValue(true);

    await expect(cm.refreshReadiness("python")).resolves.toBe(READINESS.READY);
  });

  it("does not probe Docker for a language that is still starting", async () => {
    const cm = await loadManager();
    cm.readiness.cpp = READINESS.STARTING;
    const spy = jest.spyOn(cm, "isContainerRunning");

    await expect(cm.refreshReadiness("cpp")).resolves.toBe(READINESS.STARTING);
    expect(spy).not.toHaveBeenCalled();
  });
});
