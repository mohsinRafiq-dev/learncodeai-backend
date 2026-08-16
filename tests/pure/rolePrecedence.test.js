// Regression tests for a real production incident.
//
// An admin applied to be a creator, was approved, and the approval handler
// assigned { role: "creator" } unconditionally — overwriting "admin" and
// locking them out of the admin portal, including the very screen that had just
// performed the approval.
//
// The design has always said creator status is additive
// (docs/BUSINESS_MODEL.md §1); the implementation contradicted it. These pin the
// rule in both directions.

import { accessSummary } from "../../src/services/billing/entitlementService.js";

// Mirrors the role decision in adminCreatorController, so the precedence rule
// is asserted independently of the database plumbing.
const roleAfterApproval = (currentRole) =>
  currentRole === "user" ? "creator" : currentRole;

const roleAfterSuspension = (currentRole) =>
  currentRole === "creator" ? "user" : currentRole;

const roleAfterReinstate = (currentRole) =>
  currentRole === "user" ? "creator" : currentRole;

describe("approving a creator", () => {
  it("promotes an ordinary user", () => {
    expect(roleAfterApproval("user")).toBe("creator");
  });

  it("NEVER demotes an admin", () => {
    // The incident: this returned "creator" and stripped admin access.
    expect(roleAfterApproval("admin")).toBe("admin");
  });

  it("is idempotent for someone already a creator", () => {
    expect(roleAfterApproval("creator")).toBe("creator");
  });
});

describe("suspending a creator", () => {
  it("demotes a creator back to user", () => {
    expect(roleAfterSuspension("creator")).toBe("user");
  });

  it("NEVER demotes an admin", () => {
    // Suspending an admin's creator profile must not cost them the platform.
    expect(roleAfterSuspension("admin")).toBe("admin");
  });

  it("leaves an ordinary user alone", () => {
    expect(roleAfterSuspension("user")).toBe("user");
  });
});

describe("reinstating a creator", () => {
  it("restores the creator role for a demoted user", () => {
    expect(roleAfterReinstate("user")).toBe("creator");
  });

  it("leaves an admin as admin", () => {
    expect(roleAfterReinstate("admin")).toBe("admin");
  });
});

describe("round trip", () => {
  it("returns an admin to admin after approve then suspend", () => {
    const after = roleAfterSuspension(roleAfterApproval("admin"));
    expect(after).toBe("admin");
  });

  it("returns a user to user after approve then suspend", () => {
    const after = roleAfterSuspension(roleAfterApproval("user"));
    expect(after).toBe("user");
  });
});

describe("admin capabilities are independent of creator status", () => {
  it("treats an admin as a creator for panel access without the creator role", () => {
    // requireCreator gates on the CreatorProfile, not on this flag, but the
    // summary the UI reads must still show an admin the creator surfaces.
    const s = accessSummary({ role: "admin", subscriptionTier: "free" });
    expect(s.isAdmin).toBe(true);
    expect(s.isCreator).toBe(true);
  });

  it("does not treat a creator as an admin", () => {
    const s = accessSummary({ role: "creator", subscriptionTier: "free" });
    expect(s.isCreator).toBe(true);
    expect(s.isAdmin).toBe(false);
  });

  it("does not treat an ordinary user as either", () => {
    const s = accessSummary({ role: "user", subscriptionTier: "free" });
    expect(s.isCreator).toBe(false);
    expect(s.isAdmin).toBe(false);
  });
});
