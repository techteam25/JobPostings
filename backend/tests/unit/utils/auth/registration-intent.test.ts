import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthState = vi.hoisted(() => ({
  data: null as { intent?: unknown } | null,
}));

vi.mock("better-auth/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("better-auth/api")>();
  return { ...actual, getOAuthState: async () => oauthState.data };
});

import { auth } from "@/utils/auth";
import { env } from "@shared/config/env";

const beforeUserCreate = auth.options.databaseHooks.user.create.before;
type HookUser = Parameters<typeof beforeUserCreate>[0];
type HookContext = Parameters<typeof beforeUserCreate>[1];

function context(path: string, body?: Record<string, unknown>): HookContext {
  return { path, body } as unknown as HookContext;
}

describe("registration intent", () => {
  beforeEach(() => {
    oauthState.data = null;
  });

  it("sets a validated email signup intent before user creation", async () => {
    const newUser = {} as HookUser;
    await expect(
      beforeUserCreate(
        newUser,
        context("/sign-up/email", { intent: "employer" }),
      ),
    ).resolves.toEqual({ data: { intent: "employer" } });
    await expect(
      beforeUserCreate(newUser, context("/sign-up/email")),
    ).resolves.toEqual({ data: { intent: "seeker" } });
    await expect(
      beforeUserCreate(newUser, context("/sign-up/email", { intent: "admin" })),
    ).rejects.toThrow("Invalid registration intent");
  });

  it("uses validated OAuth state only when a new user is created", async () => {
    oauthState.data = { intent: "employer" };
    await expect(
      beforeUserCreate({} as HookUser, context("/callback/:id")),
    ).resolves.toEqual({ data: { intent: "employer" } });

    oauthState.data = { intent: "admin" };
    await expect(
      beforeUserCreate({} as HookUser, context("/callback/:id")),
    ).resolves.toEqual({ data: { intent: "seeker" } });
  });

  it("configures the validated server URL for every environment", () => {
    expect(auth.options.baseURL).toBe(env.SERVER_URL);
  });
});
