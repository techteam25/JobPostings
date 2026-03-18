import { test as base, type Page } from "@playwright/test";
import { SignInPage } from "./pages/sign-in.page";

type TestFixtures = {
  authenticatedPage: Page;
  employerPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await signInPage.login(
      process.env.TEST_USER_EMAIL ?? "user_11@example.com",
      process.env.TEST_USER_PASSWORD ?? "Password@123",
    );
    await page.waitForURL("/");
    await use(page);
  },

  employerPage: async ({ page }, use) => {
    const signInPage = new SignInPage(page);
    await signInPage.goto();
    await signInPage.login(
      process.env.TEST_EMPLOYER_EMAIL ?? "user_1@example.com",
      process.env.TEST_EMPLOYER_PASSWORD ?? "Password@123",
    );
    // Employer is redirected to organizations after login
    await page.waitForURL(/\/employer\//);
    await use(page);
  },
});

export { expect } from "@playwright/test";
