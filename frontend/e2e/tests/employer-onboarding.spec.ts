import { test, expect } from "../fixtures";
import { test as base, expect as baseExpect } from "@playwright/test";
import { SignInPage } from "../pages/sign-in.page";

test.describe("Employer Flow", () => {
  test(
    "employer login redirects to employer area",
    async ({ employerPage: page }) => {
      // Employer should be redirected to employer organizations area
      await expect(page).toHaveURL(/\/employer\//);
    },
  );

  test(
    "employer can access organization dashboard",
    async ({ employerPage: page }) => {
      // Should be on an employer page (organizations list or specific org)
      await expect(page).toHaveURL(/\/employer\//);

      // Verify some content loaded
      await expect(page.locator("body")).not.toBeEmpty();
    },
  );
});

base.describe("Employer Onboarding", () => {
  base(
    "unauthenticated user is redirected from onboarding",
    async ({ page }) => {
      await page.goto("/employer/onboarding");

      // Should be redirected to sign-in
      await page.waitForURL(/\/sign-in/, { timeout: 10000 });
      await baseExpect(page).toHaveURL(/\/sign-in/);
    },
  );
});
