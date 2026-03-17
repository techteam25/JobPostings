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
 * Also blocks imports from the deprecated `@/ports/` directory — shared
 * infrastructure ports live in `@shared/ports/`.
 */
function crossModuleBoundaryPatterns(currentModule: string) {
  return [
    ...MODULE_NAMES.filter((m) => m !== currentModule).map((m) => ({
      group: [`@/modules/${m}/**`],
      message: `Import from "@/modules/${m}" (public API) instead of internal paths.`,
    })),
    {
      group: ["@/ports/*"],
      message:
        'Use "@shared/ports/<port-name>" for shared infrastructure ports. Facade-era ports in @/ports/ should not be imported by module code.',
    },
  ];
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

  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["tests/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ─── Per-Module Overrides ────────────────────────────────────────
  ...perModuleOverrides,
);
