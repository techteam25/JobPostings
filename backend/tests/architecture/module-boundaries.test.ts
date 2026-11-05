import {
  projectFiles,
  type ViolatingFileDependency,
  ImportKind,
} from "archunit";

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

/** Filter violations to only value (runtime) imports. */
function onlyValueImports(violations: ViolatingFileDependency[]) {
  return violations.filter((v) =>
    v.dependency.cumulatedEdges.some((e) =>
      e.importKinds.includes(ImportKind.VALUE),
    ),
  );
}

describe("Architecture: Module Boundaries", () => {
  vi.setConfig({ testTimeout: 120_000 });

  describe("shared code does not depend on modules", () => {
    for (const subdir of PROTECTED_SHARED_SUBDIRS) {
      it(`shared/${subdir} → modules is forbidden`, async () => {
        const rule = projectFiles()
          .inFolder(`src/shared/${subdir}/**`)
          .shouldNot()
          .dependOnFiles()
          .inFolder("src/modules/**");

        await expect(rule).toPassAsync();
      });
    }
  });

  describe("validations do not depend on modules", () => {
    it("validations → modules is forbidden", async () => {
      const rule = projectFiles()
        .inFolder("src/validations/**")
        .shouldNot()
        .dependOnFiles()
        .inFolder("src/modules/**");

      await expect(rule).toPassAsync();
    });
  });

  describe("db/schema does not depend on modules", () => {
    it("src/db/schema → modules is forbidden", async () => {
      const rule = projectFiles()
        .inFolder("src/db/schema/**")
        .shouldNot()
        .dependOnFiles()
        .inFolder("src/modules/**");

      await expect(rule).toPassAsync();
    });
  });

  // Cross-module VALUE imports are forbidden — modules define their
  // own ports, implemented by adapters in shared/adapters/.
  //
  // Type-only imports (import type) are temporarily permitted for
  // guard types injected via route constructors. Once each module
  // defines its own guard port, tighten this to check ALL imports.
  describe("cross-module isolation (value imports)", () => {
    for (const source of MODULES) {
      for (const target of MODULES) {
        if (source === target) continue;

        it(`${source} → ${target} value import is forbidden`, async () => {
          const rule = projectFiles()
            .inFolder(`src/modules/${source}/**`)
            .shouldNot()
            .dependOnFiles()
            .inFolder(`src/modules/${target}/**`);

          const violations = (await rule.check()) as ViolatingFileDependency[];
          expect(onlyValueImports(violations)).toEqual([]);
        });
      }
    }
  });

  describe("modules are cycle-free", () => {
    for (const mod of MODULES) {
      it(`${mod} has no circular dependencies`, async () => {
        const rule = projectFiles()
          .inFolder(`src/modules/${mod}/**`)
          .should()
          .haveNoCycles();

        await expect(rule).toPassAsync();
      });
    }
  });
});
