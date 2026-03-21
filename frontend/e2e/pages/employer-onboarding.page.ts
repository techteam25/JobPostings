import { type Page } from "@playwright/test";

export class EmployerOnboardingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/employer/onboarding");
  }

  // Step 1: General Company Info
  async fillCompanyInfo(data: {
    name: string;
    industry?: string;
    size?: string;
  }) {
    await this.companyNameInput.fill(data.name);
  }

  // Step navigation
  async clickNext() {
    await this.page.getByRole("button", { name: /next/i }).click();
  }

  async clickPrevious() {
    await this.page.getByRole("button", { name: /previous/i }).click();
  }

  async clickSubmit() {
    await this.page.getByRole("button", { name: /submit|create/i }).click();
  }

  get companyNameInput() {
    return this.page.getByLabel(/company name|organization name/i);
  }
  get progressBar() {
    return this.page.locator("[role='progressbar']");
  }
}
