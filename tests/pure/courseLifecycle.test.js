// Tests for the course state machine.
//
// The point of centralising transitions is that a course cannot reach
// `published` by any path that skips review. These tests assert that directly,
// and that role separation holds — a creator must not be able to approve their
// own work.

import { canTransition, availableActions, STATUS } from "../../src/services/billing/courseLifecycleService.js";

const course = (status) => ({ status });
const creator = { role: "creator" };
const admin = { role: "admin" };

describe("legal transitions", () => {
  it("lets a creator submit a draft", () => {
    expect(canTransition(course(STATUS.DRAFT), "submit", creator.role)).toMatchObject({
      ok: true,
      to: STATUS.PENDING,
    });
  });

  it("lets a rejected course be resubmitted", () => {
    expect(canTransition(course(STATUS.REJECTED), "submit", creator.role).ok).toBe(true);
  });

  it("lets an admin approve a pending course", () => {
    expect(canTransition(course(STATUS.PENDING), "approve", admin.role)).toMatchObject({
      ok: true,
      to: STATUS.APPROVED,
    });
  });

  it("lets a creator publish an approved course", () => {
    expect(canTransition(course(STATUS.APPROVED), "publish", creator.role)).toMatchObject({
      ok: true,
      to: STATUS.PUBLISHED,
    });
  });

  it("lets a creator unpublish, returning to approved rather than draft", () => {
    // Unpublishing must not force another review round-trip.
    expect(canTransition(course(STATUS.PUBLISHED), "unpublish", creator.role)).toMatchObject({
      ok: true,
      to: STATUS.APPROVED,
    });
  });
});

describe("review cannot be skipped", () => {
  it("refuses to publish straight from draft", () => {
    const r = canTransition(course(STATUS.DRAFT), "publish", creator.role);
    expect(r.ok).toBe(false);
  });

  it("refuses to publish while still pending review", () => {
    expect(canTransition(course(STATUS.PENDING), "publish", creator.role).ok).toBe(false);
  });

  it("refuses to publish a rejected course", () => {
    expect(canTransition(course(STATUS.REJECTED), "publish", creator.role).ok).toBe(false);
  });

  it("refuses to publish a suspended course", () => {
    expect(canTransition(course(STATUS.SUSPENDED), "publish", creator.role).ok).toBe(false);
  });

  it("offers a creator no path to published from draft in one step", () => {
    const actions = availableActions(course(STATUS.DRAFT), creator.role);
    expect(actions).not.toContain("publish");
    expect(actions).toContain("submit");
  });
});

describe("role separation", () => {
  it("does not let a creator approve their own course", () => {
    const r = canTransition(course(STATUS.PENDING), "approve", creator.role);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/administrator/i);
  });

  it("does not let a creator reject", () => {
    expect(canTransition(course(STATUS.PENDING), "reject", creator.role).ok).toBe(false);
  });

  it("does not let a creator suspend", () => {
    expect(canTransition(course(STATUS.PUBLISHED), "suspend", creator.role).ok).toBe(false);
  });

  it("does not let a creator reinstate a suspended course", () => {
    expect(canTransition(course(STATUS.SUSPENDED), "reinstate", creator.role).ok).toBe(false);
  });

  it("gives an admin no approve action on an already-approved course", () => {
    expect(availableActions(course(STATUS.APPROVED), "admin")).not.toContain("approve");
  });
});

describe("availableActions", () => {
  it("offers a pending course withdraw to its creator", () => {
    expect(availableActions(course(STATUS.PENDING), "creator")).toContain("withdraw");
  });

  it("offers an admin both decisions on a pending course", () => {
    const actions = availableActions(course(STATUS.PENDING), "admin");
    expect(actions).toEqual(expect.arrayContaining(["approve", "reject"]));
  });

  it("returns nothing actionable for an unknown state", () => {
    expect(availableActions(course("archived"), "admin")).toEqual([]);
  });
});

describe("unknown actions", () => {
  it("is rejected rather than silently permitted", () => {
    const r = canTransition(course(STATUS.DRAFT), "delete_everything", "admin");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unknown action/i);
  });
});
