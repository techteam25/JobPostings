import { test as base, expect as baseExpect } from "@playwright/test";
import { SignInPage } from "../pages/sign-in.page";
import { SignUpPage } from "../pages/sign-up.page";

base.describe("Authentication Flow", () => {
  base.describe("Sign-in page", () => {
    base.beforeEach(async ({ page }) => {
      await page.goto("/sign-in");
    });

    base("renders all sign-in form elements", async ({ page }) => {
      const signInPage = new SignInPage(page);

      await baseExpect(signInPage.emailInput).toBeVisible();
      await baseExpect(signInPage.passwordInput).toBeVisible();
      await baseExpect(signInPage.loginButton).toBeVisible();
      await baseExpect(signInPage.googleButton).toBeVisible();
      await baseExpect(signInPage.linkedInButton).toBeVisible();
      await baseExpect(signInPage.signUpLink).toBeVisible();
    });

    base("successful login redirects to home page", async ({ page }) => {
      const signInPage = new SignInPage(page);

      await signInPage.login(
        process.env.TEST_USER_EMAIL ?? "user_11@example.com",
        process.env.TEST_USER_PASSWORD ?? "Password@123",
      );

      await page.waitForURL("/", { timeout: 10000 });
      await baseExpect(page).toHaveURL("/");
    });

    base("invalid credentials show error", async ({ page }) => {
      const signInPage = new SignInPage(page);

      await signInPage.login("invalid@example.com", "wrongpassword");

      // Wait for error toast or error message
      const errorToast = page.locator("[data-sonner-toast][data-type='error']");
      await baseExpect(errorToast).toBeVisible({ timeout: 5000 });
    });

    base("sign-up link navigates to registration page", async ({ page }) => {
      const signInPage = new SignInPage(page);

      await signInPage.signUpLink.click();
      await baseExpect(page).toHaveURL(/\/sign-up/);
    });
  });

  base.describe("Sign-up page", () => {
    base.beforeEach(async ({ page }) => {
      await page.goto("/sign-up");
    });

    base("renders all registration form elements", async ({ page }) => {
      const signUpPage = new SignUpPage(page);

      await baseExpect(signUpPage.heading).toBeVisible();
      await baseExpect(signUpPage.seekerButton).toBeVisible();
      await baseExpect(signUpPage.employerButton).toBeVisible();
      await baseExpect(signUpPage.firstNameInput).toBeVisible();
      await baseExpect(signUpPage.lastNameInput).toBeVisible();
      await baseExpect(signUpPage.emailInput).toBeVisible();
      await baseExpect(signUpPage.passwordInput).toBeVisible();
      await baseExpect(signUpPage.confirmPasswordInput).toBeVisible();
      await baseExpect(signUpPage.termsCheckbox).toBeVisible();
      await baseExpect(signUpPage.registerButton).toBeVisible();
    });

    base("sign-in link navigates to login page", async ({ page }) => {
      const signUpPage = new SignUpPage(page);

      await signUpPage.signInLink.click();
      await baseExpect(page).toHaveURL(/\/sign-in/);
    });
  });

  base.describe("Route protection", () => {
    base(
      "unauthenticated user is redirected to sign-in when accessing protected route",
      async ({ page }) => {
        await page.goto("/applications");

        await page.waitForURL(/\/sign-in/, { timeout: 10000 });
        await baseExpect(page).toHaveURL(/\/sign-in/);
      },
    );

    base(
      "unauthenticated user is redirected when accessing saved jobs",
      async ({ page }) => {
        await page.goto("/saved");

        await page.waitForURL(/\/sign-in/, { timeout: 10000 });
        await baseExpect(page).toHaveURL(/\/sign-in/);
      },
    );
  });
});
