import { type Locator, type Page } from "@playwright/test";

/**
 * Page object for the job-seeker qualifications page
 * (`/me/profile/qualifications`) and its Add/Edit dialogs, with helpers for the
 * ScrollableArea affordances (bottom fade, top fade, and the "Scroll for more"
 * pill).
 */
export class QualificationsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/me/profile/qualifications");
  }

  async openAddWorkExperience() {
    await this.addWorkExperienceButton.click();
    await this.dialog.waitFor({ state: "visible" });
  }

  get addWorkExperienceButton() {
    return this.page.getByRole("button", { name: /add work experience/i });
  }

  get dialog() {
    return this.page.getByRole("dialog");
  }

  get scrollContainer() {
    return this.dialog.getByTestId("scroll-affordance-viewport");
  }

  get bottomFade() {
    return this.dialog.getByTestId("scroll-affordance-bottom-fade");
  }

  get topFade() {
    return this.dialog.getByTestId("scroll-affordance-top-fade");
  }

  get scrollButton() {
    return this.dialog.getByTestId("scroll-affordance-button");
  }

  /** Reads scroll metrics from the ScrollableArea viewport. */
  async scrollMetrics(): Promise<{
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
  }> {
    return this.scrollContainer.evaluate((el) => ({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
  }

  /** Jumps the viewport to the bottom (used to assert the end state). */
  async scrollToBottom() {
    await this.scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }

  /** True when the affordance element is in the DOM and visually opaque. */
  async isAffordanceVisible(locator: Locator): Promise<boolean> {
    const count = await locator.count();
    if (count === 0) return false;
    const opacity = await locator.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    const box = await locator.boundingBox();
    return Number(opacity) > 0.5 && !!box && box.width > 0 && box.height > 0;
  }
}
