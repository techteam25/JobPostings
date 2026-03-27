import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import boundaries from "eslint-plugin-boundaries";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  // ─── Module Boundary Enforcement (eslint-plugin-boundaries) ────────
  {
    files: ["src/**/*.ts"],
    plugins: { boundaries },
    settings: {
      // Element types — ordered most-specific first (first match wins).
      "boundaries/elements": [
        { type: "adapter", pattern: "shared/adapters", mode: "folder" },
        { type: "worker", pattern: "shared/workers", mode: "folder" },
        {
          type: "module",
          pattern: "modules/*",
          mode: "folder",
          capture: ["moduleName"],
        },
        { type: "shared", pattern: "shared/*", mode: "folder" },
        { type: "validation", pattern: "validations", mode: "folder" },
        { type: "middleware", pattern: "middleware", mode: "folder" },
        { type: "db", pattern: "db", mode: "folder" },
        { type: "swagger", pattern: "swagger", mode: "folder" },
        { type: "utils", pattern: "utils", mode: "folder" },
        { type: "app", pattern: "src", mode: "folder" },
      ],
      "boundaries/include": ["src/**/*.ts"],
      "boundaries/legacy-templates": false,
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      // ─── Dependency rules ──────────────────────────────────────────
      // default: disallow — only explicitly allowed imports are permitted.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            // Modules → same/other modules (public API enforced by entry-point),
            // shared, validations, db schemas, middleware, swagger, utils
            {
              from: { type: "module" },
              allow: {
                to: [
                  { type: "module" },
                  { type: "shared" },
                  { type: "validation" },
                  { type: "db" },
                  { type: "middleware" },
                  { type: "swagger" },
                  { type: "utils" },
                ],
              },
            },
            // Adapters bridge modules via port interfaces
            {
              from: { type: "adapter" },
              allow: {
                to: [
                  { type: "module" },
                  { type: "shared" },
                  { type: "validation" },
                  { type: "db" },
                ],
              },
            },
            // Shared workers coordinate domain events across modules
            {
              from: { type: "worker" },
              allow: {
                to: [
                  { type: "module" },
                  { type: "shared" },
                  { type: "validation" },
                  { type: "db" },
                ],
              },
            },
            // Shared infrastructure (no module imports)
            {
              from: { type: "shared" },
              allow: {
                to: [
                  { type: "shared" },
                  { type: "validation" },
                  { type: "db" },
                  { type: "utils" },
                ],
              },
            },
            // Validations (Zod schemas + OpenAPI)
            {
              from: { type: "validation" },
              allow: {
                to: [
                  { type: "shared" },
                  { type: "validation" },
                  { type: "db" },
                  { type: "swagger" },
                ],
              },
            },
            // Middleware
            {
              from: { type: "middleware" },
              allow: {
                to: [
                  { type: "shared" },
                  { type: "validation" },
                  { type: "db" },
                  { type: "swagger" },
                  { type: "utils" },
                ],
              },
            },
            // DB schemas and seeds
            {
              from: { type: "db" },
              allow: {
                to: [
                  { type: "shared" },
                  { type: "db" },
                  { type: "validation" },
                  { type: "utils" },
                  { type: "app" },
                ],
              },
            },
            // Swagger / OpenAPI registry
            {
              from: { type: "swagger" },
              allow: {
                to: [{ type: "shared" }],
              },
            },
            // Utility helpers (src/utils/ — includes Better-Auth setup)
            {
              from: { type: "utils" },
              allow: {
                to: [
                  { type: "shared" },
                  { type: "db" },
                  { type: "module" },
                  { type: "validation" },
                ],
              },
            },
            // App-level code (composition root, routes) — unrestricted
            {
              from: { type: "app" },
              allow: {
                to: [
                  { type: "module" },
                  { type: "shared" },
                  { type: "validation" },
                  { type: "adapter" },
                  { type: "worker" },
                  { type: "db" },
                  { type: "middleware" },
                  { type: "swagger" },
                  { type: "utils" },
                ],
              },
            },
          ],
        },
      ],
      // ─── Entry point: modules importable only via index.ts ─────────
      "boundaries/entry-point": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              target: [{ type: "module" }],
              allow: ["index.ts"],
            },
            {
              target: [
                { type: "shared" },
                { type: "adapter" },
                { type: "worker" },
                { type: "validation" },
                { type: "middleware" },
                { type: "db" },
                { type: "swagger" },
                { type: "utils" },
                { type: "app" },
              ],
              allow: ["**/*"],
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
    files: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
