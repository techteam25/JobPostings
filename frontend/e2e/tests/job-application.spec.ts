import { test, expect } from "../fixtures";

test.describe("Job Application Flow", () => {
  test(
    "authenticated user can view job listings on home page",
    async ({ authenticatedPage: page }) => {
      // User should be on the home page after login
      await expect(page).toHaveURL("/");

      // Verify that the page has loaded with job-related content
      await expect(
        page.getByRole("heading").first(),
      ).toBeVisible({ timeout: 10000 });
    },
  );

  test(
    "authenticated user can navigate to applications page",
    async ({ authenticatedPage: page }) => {
      await page.goto("/applications");

      // Should stay on applications page (not redirected to sign-in)
      await expect(page).toHaveURL(/\/applications/);
    },
  );

  test(
    "authenticated user can navigate to saved jobs",
    async ({ authenticatedPage: page }) => {
      await page.goto("/saved");

      // Should stay on saved jobs page
      await expect(page).toHaveURL(/\/saved/);
    },
  );

  test(
    "authenticated user can access profile page",
    async ({ authenticatedPage: page }) => {
      await page.goto("/me/profile");

      // Should stay on profile page (not redirected)
      await expect(page).toHaveURL(/\/me\/profile/);
    },
  );
});
