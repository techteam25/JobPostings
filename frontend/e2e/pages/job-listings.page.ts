import { type Page } from "@playwright/test";

export class JobListingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  async searchJobs(query: string) {
    await this.searchInput.fill(query);
  }

  async clickFirstJob() {
    const firstJob = this.page.locator("[data-testid='job-card']").first();
    await firstJob.click();
  }

  get searchInput() {
    return this.page.getByPlaceholder(/search/i);
  }
  get jobCards() {
    return this.page.locator("[data-testid='job-card']");
  }
  get forYouTab() {
    return this.page.getByRole("tab", { name: /For You/i });
  }
  get searchTab() {
    return this.page.getByRole("tab", { name: /Search/i });
  }
}
