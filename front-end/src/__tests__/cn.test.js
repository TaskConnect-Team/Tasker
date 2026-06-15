import { describe, it, expect } from "vitest";
import { cn } from "../utils/cn";

describe("cn utility", () => {
  it("joins multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters out falsy values", () => {
    expect(cn("foo", null, undefined, false, 0, "", "bar")).toBe("foo bar");
  });

  it("returns empty string when called with no args", () => {
    expect(cn()).toBe("");
  });

  it("returns single class when only one truthy value", () => {
    expect(cn(false, "active", null)).toBe("active");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("btn", isActive && "btn-active", isDisabled && "btn-disabled")).toBe(
      "btn btn-active",
    );
  });
});
