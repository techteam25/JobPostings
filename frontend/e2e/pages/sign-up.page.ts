import { type Page } from "@playwright/test";

export class SignUpPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/sign-up");
  }

  async fillRegistrationForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    accountType?: "seeker" | "employer";
  }) {
    if (data.accountType === "employer") {
      await this.employerButton.click();
    }

    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.password);
    await this.termsCheckbox.click();
  }

  get heading() {
    return this.page.getByRole("heading", { name: /Create Account/ });
  }
  get seekerButton() {
    return this.page.getByRole("button", { name: /Job Seeker/ });
  }
  get employerButton() {
    return this.page.getByRole("button", { name: /Employer/ });
  }
  get firstNameInput() {
    return this.page.getByLabel("First Name");
  }
  get lastNameInput() {
    return this.page.getByLabel("Last Name");
  }
  get emailInput() {
    return this.page.getByLabel("Email Address");
  }
  get passwordInput() {
    return this.page.getByLabel("Password", { exact: true });
  }
  get confirmPasswordInput() {
    return this.page.getByLabel("Confirm Password");
  }
  get termsCheckbox() {
    return this.page.getByRole("checkbox");
  }
  get registerButton() {
    return this.page.getByRole("button", { name: "Register" });
  }
  get signInLink() {
    return this.page.getByRole("link", { name: "Sign in" });
  }
  get googleButton() {
    return this.page.getByRole("button", { name: /Google/ });
  }
  get linkedInButton() {
    return this.page.getByRole("button", { name: /LinkedIn/ });
  }
}
