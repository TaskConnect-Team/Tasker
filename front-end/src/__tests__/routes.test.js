import { describe, it, expect } from "vitest";
import { ROUTES, getDashboardHome } from "../constants/routes";

describe("ROUTES constant", () => {
  it("defines expected route keys", () => {
    expect(ROUTES.login).toBe("/login");
    expect(ROUTES.signup).toBe("/signup");
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.customerDashboard).toBe("/customer-dashboard");
    expect(ROUTES.taskerDashboard).toBe("/tasker-dashboard");
    expect(ROUTES.postTask).toBe("/post-task");
    expect(ROUTES.notifications).toBe("/notifications");
    expect(ROUTES.profile).toBe("/profile");
    expect(ROUTES.activeJobs).toBe("/active-jobs");
    expect(ROUTES.earnings).toBe("/earnings");
    expect(ROUTES.settings).toBe("/settings");
    expect(ROUTES.privacy).toBe("/privacy");
    expect(ROUTES.map).toBe("/map");
  });
});

describe("getDashboardHome", () => {
  it("returns tasker dashboard for tasker role", () => {
    expect(getDashboardHome("tasker")).toBe("/tasker-dashboard");
  });

  it("returns customer dashboard for customer role", () => {
    expect(getDashboardHome("customer")).toBe("/customer-dashboard");
  });

  it("returns customer dashboard for unknown role", () => {
    expect(getDashboardHome("admin")).toBe("/customer-dashboard");
  });

  it("returns customer dashboard for undefined role", () => {
    expect(getDashboardHome(undefined)).toBe("/customer-dashboard");
  });
});
