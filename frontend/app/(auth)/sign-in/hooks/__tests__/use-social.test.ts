import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const signInSocial = vi.fn();

vi.mock("@/lib/auth", () => ({
  authClient: {
    signIn: {
      social: (...args: unknown[]) => signInSocial(...args),
    },
  },
}));

vi.mock("@/env", () => ({
  env: {
    NEXT_PUBLIC_FRONTEND_URL: "http://localhost:3000",
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { useSocialAuth } from "@/app/(auth)/sign-in/hooks/use-social";

describe("useSocialAuth", () => {
  beforeEach(() => {
    signInSocial.mockReset();
    signInSocial.mockResolvedValue({});
  });

  it("routes OAuth through /post-login so intent drives the final landing", async () => {
    const { result } = renderHook(() => useSocialAuth());

    await act(async () => {
      await result.current.handleSocialAuth("google");
    });

    expect(signInSocial).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "http://localhost:3000/post-login",
      errorCallbackURL: "http://localhost:3000/sign-in",
      newUserCallbackURL: "http://localhost:3000/post-login",
    });
  });
});
