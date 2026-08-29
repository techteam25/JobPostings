import { describe, expect, it } from "vitest";

import { getPostAuthRedirectUrl } from "@/lib/post-auth-redirect";

describe("getPostAuthRedirectUrl", () => {
  it("sends completed employers to organizations", () => {
    expect(getPostAuthRedirectUrl("employer", "completed")).toBe(
      "/employer/organizations",
    );
  });

  it("sends pending employers to onboarding", () => {
    expect(getPostAuthRedirectUrl("employer", "pending")).toBe(
      "/employer/onboarding",
    );
  });

  it("sends seekers to the job board home", () => {
    expect(getPostAuthRedirectUrl("seeker", "pending")).toBe("/");
    expect(getPostAuthRedirectUrl("seeker", "completed")).toBe("/");
  });
});
