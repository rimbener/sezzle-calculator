import { describe, expect, it } from "vitest";

import rootPackage from "../../../package.json" with { type: "json" };
import turbo from "../../../turbo.json" with { type: "json" };

// Characterization: pins the root task graph so a fix to one task shows the
// others unchanged.
describe("root turbo.json task graph", () => {
  it("keeps the five root tasks", () => {
    expect(Object.keys(turbo.tasks).sort()).toEqual(
      ["build", "check-types", "dev", "lint", "test"].sort(),
    );
  });

  it("keeps build depending on upstream builds with the same inputs", () => {
    expect(turbo.tasks.build.dependsOn).toEqual(["^build"]);
    expect(turbo.tasks.build.inputs).toEqual(["$TURBO_DEFAULT$", ".env*"]);
  });

  it("keeps lint and check-types fanning out upstream first", () => {
    expect(turbo.tasks.lint.dependsOn).toEqual(["^lint"]);
    expect(turbo.tasks["check-types"].dependsOn).toEqual(["^check-types"]);
  });

  it("keeps test uncoupled and dev persistent and uncached", () => {
    expect(turbo.tasks.test).toEqual({});
    expect(turbo.tasks.dev).toEqual({ cache: false, persistent: true });
  });
});

// Characterization: pins the package-manager declaration Turborepo needs to
// resolve the workspace. AGENTS.md § Commands carries the rationale; a change
// here is a decision, not a cleanup.
describe("root package.json package-manager declaration", () => {
  it("declares npm ^11.0.0 through devEngines with onFail warn", () => {
    expect(rootPackage.devEngines.packageManager).toEqual({
      name: "npm",
      version: "^11.0.0",
      onFail: "warn",
    });
  });

  it("does not carry Corepack's packageManager pin alongside it", () => {
    expect("packageManager" in rootPackage).toBe(false);
  });
});
