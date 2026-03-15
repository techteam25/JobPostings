import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import type { Linter } from "eslint";

// ─── Module Boundary Enforcement ─────────────────────────────────────
// All bounded modules in the system. Used to generate ESLint rules that
// prevent cross-module deep imports (bypassing the public API / index.ts).
const MODULE_NAMES = [
  "identity",
  "user-profile",
  "job-board",
  "applications",
  "organizations",
  "invitations",
  "notifications",
] as const;

/**
 * Creates `no-restricted-imports` patterns that block deep imports into
 * OTHER modules while allowing a module to import its own internals.
 */
function crossModuleBoundaryPatterns(currentModule: string) {
  return MODULE_NAMES.filter((m) => m !== currentModule).map((m) => ({
    group: [`@/modules/${m}/**`],
    message: `Import from "@/modules/${m}" (public API) instead of internal paths.`,
  }));
}

// Per-module overrides: each module may import its own internals but NOT other modules'.
const perModuleOverrides: Linter.Config[] = MODULE_NAMES.map((mod) => ({
  files: [`src/modules/${mod}/**/*.ts`],
  rules: {
    "no-restricted-imports": [
      "error" as const,
      {
        patterns: crossModuleBoundaryPatterns(mod),
      },
    ],
  },
}));

export default tseslint.config(
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  // ─── Global: Block ALL deep module imports ───────────────────────
  // Any file outside src/modules/ must import from the module's index.
  {
    files: ["src/**/*.ts"],
    ignores: ["src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/**"],
              message:
                'Import from "@/modules/<module-name>" (public API) instead of internal paths.',
            },
          ],
        },
      ],
    },
  },

  // ─── Per-Module Overrides ────────────────────────────────────────
  ...perModuleOverrides,

  // ─── Legacy Exemptions ──────────────────────────────────────────
  // Old facade files and workers still use deep imports. These will be
  // cleaned up in Phase 8 (migrate workers to module-owned processors)
  // and when facades are deleted.
  {
    files: [
      "src/services/**/*.ts",
      "src/repositories/**/*.ts",
      "src/workers/**/*.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
