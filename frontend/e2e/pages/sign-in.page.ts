import { type Page } from "@playwright/test";

export class SignInPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/sign-in");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  get emailInput() {
    return this.page.getByLabel("Email Address");
  }
  get passwordInput() {
    return this.page.getByLabel("Password");
  }
  get loginButton() {
    return this.page.getByRole("button", { name: "Login" });
  }
  get googleButton() {
    return this.page.getByRole("button", { name: /Google/ });
  }
  get linkedInButton() {
    return this.page.getByRole("button", { name: /LinkedIn/ });
  }
  get signUpLink() {
    return this.page.getByRole("link", { name: "Sign up" });
  }
  get forgotPasswordButton() {
    return this.page.getByRole("button", { name: /Forgot password/ });
  }
}
