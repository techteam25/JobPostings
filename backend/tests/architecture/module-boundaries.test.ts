import { filesOfProject } from "tsarch";

const MODULES = [
  "identity",
  "user-profile",
  "job-board",
  "applications",
  "organizations",
  "invitations",
  "notifications",
] as const;

// Shared subdirectories that must NOT import from modules.
// Excludes shared/adapters/ (bridge modules via ports) and
// shared/workers/ (coordinate domain events across modules).
const PROTECTED_SHARED_SUBDIRS = [
  "base",
  "config",
  "constants",
  "db",
  "errors",
  "events",
  "infrastructure",
  "logger",
  "ports",
  "result",
  "types",
  "utils",
] as const;

describe("Architecture: Module Boundaries", () => {
  // tsarch parses the full TypeScript project graph — allow extra time
  vi.setConfig({ testTimeout: 120_000 });

  describe("shared code does not depend on modules", () => {
    for (const subdir of PROTECTED_SHARED_SUBDIRS) {
      it(`shared/${subdir} → modules is forbidden`, async () => {
        const rule = filesOfProject()
          .inFolder(`src/shared/${subdir}`)
          .shouldNot()
          .dependOnFiles()
          .inFolder("src/modules");

        const violations = await rule.check();
        expect(violations).toEqual([]);
      });
    }
  });

  describe("validations do not depend on modules", () => {
    it("validations → modules is forbidden", async () => {
      const rule = filesOfProject()
        .inFolder("src/validations")
        .shouldNot()
        .dependOnFiles()
        .inFolder("src/modules");

      const violations = await rule.check();
      expect(violations).toEqual([]);
    });
  });

  // Modules can import own internals.
  // Cross-module VALUE imports are forbidden — modules define
  // their own ports, implemented by adapters in shared/adapters/.
  describe("cross-module isolation", () => {
    for (const source of MODULES) {
      for (const target of MODULES) {
        if (source === target) continue;

        it(`${source} → ${target} is forbidden`, async () => {
          const rule = filesOfProject()
            .inFolder(`src/modules/${source}`)
            .shouldNot()
            .dependOnFiles()
            .inFolder(`src/modules/${target}`);

          const violations = await rule.check();
          expect(violations).toEqual([]);
        });
      }
    }
  });

  describe("modules are cycle-free", () => {
    for (const mod of MODULES) {
      it(`${mod} has no circular dependencies`, async () => {
        const rule = filesOfProject()
          .inFolder(`src/modules/${mod}`)
          .should()
          .beFreeOfCycles();

        const violations = await rule.check();
        expect(violations).toEqual([]);
      });
    }
  });
});
