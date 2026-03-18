import { type Page } from "@playwright/test";
import path from "path";

export class JobApplicationPage {
  constructor(private page: Page) {}

  async goto(jobId: string) {
    await this.page.goto(`/applications/new?jobId=${jobId}`);
  }

  // Step 1: Resume upload
  async uploadResume(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
  }

  // Step navigation
  async clickNext() {
    await this.page.getByRole("button", { name: /next/i }).click();
  }

  async clickPrevious() {
    await this.page.getByRole("button", { name: /previous/i }).click();
  }

  async clickSubmit() {
    await this.page.getByRole("button", { name: /submit/i }).click();
  }

  get stepIndicators() {
    return this.page.locator("[data-testid='step-indicator']");
  }
}
