import { test, expect } from "../fixtures";
import { QualificationsPage } from "../pages/qualifications.page";

/**
 * Regression coverage for the non-native scroll affordance (ScrollableArea)
 * applied to the qualifications dialogs. Uses the job-seeker `jobSeekerPage`
 * fixture (default `user_45@example.com`, which lands on `/`); the
 * `/me/profile/qualifications` page belongs to a job-seeker account.
 *
 * These assertions run against a REAL browser because the whole point of the
 * feature is browser/OS scrollbar behavior that jsdom cannot represent.
 */
test.describe("Qualifications dialog scroll affordance", () => {
  test("shows bottom fade + chevron when content overflows, and they drive scrolling", async ({
    jobSeekerPage: page,
  }) => {
    // Short viewport so the Add Work Experience dialog overflows.
    await page.setViewportSize({ width: 1000, height: 600 });

    const quals = new QualificationsPage(page);
    await quals.goto();
    await expect(page).toHaveURL(/\/me\/profile\/qualifications/);

    await quals.openAddWorkExperience();

    // Wait for the affordance to settle after mount/measure plus the Radix
    // dialog entrance + opacity transitions.
    await expect(quals.scrollButton).toBeVisible();

    // Sanity: the viewport actually overflows.
    const metrics = await quals.scrollMetrics();
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight + 2);

    // (1) initial state: bottom fade + chevron visible, top fade hidden.
    await expect
      .poll(() => quals.isAffordanceVisible(quals.bottomFade))
      .toBe(true);
    await expect
      .poll(() => quals.isAffordanceVisible(quals.scrollButton))
      .toBe(true);
    expect(await quals.isAffordanceVisible(quals.topFade)).toBe(false);

    // Screenshot evidence of the chevron + fade over the overflowing dialog.
    await quals.dialog.screenshot({
      path: ".agents/tasks/scroll-affordance/scroll-affordance.png",
    });

    // (2) clicking the chevron scrolls the container down by a page-step.
    const before = (await quals.scrollMetrics()).scrollTop;
    await quals.scrollButton.click();
    await expect
      .poll(async () => (await quals.scrollMetrics()).scrollTop)
      .toBeGreaterThan(before + metrics.clientHeight * 0.5);

    // (3) at the bottom: bottom fade + chevron gone, top fade visible.
    await quals.scrollToBottom();
    await expect
      .poll(() => quals.isAffordanceVisible(quals.scrollButton))
      .toBe(false);
    await expect
      .poll(() => quals.isAffordanceVisible(quals.bottomFade))
      .toBe(false);
    await expect
      .poll(() => quals.isAffordanceVisible(quals.topFade))
      .toBe(true);
  });

  test("shows no affordances when content fits the viewport", async ({
    jobSeekerPage: page,
  }) => {
    // Tall viewport so the dialog content fits without overflow.
    await page.setViewportSize({ width: 1000, height: 1400 });

    const quals = new QualificationsPage(page);
    await quals.goto();
    await quals.openAddWorkExperience();

    // Let layout/measure settle.
    await expect(quals.dialog).toBeVisible();
    await page.waitForTimeout(300);

    const metrics = await quals.scrollMetrics();
    expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 2);

    // (4) nothing renders when it all fits.
    expect(await quals.isAffordanceVisible(quals.bottomFade)).toBe(false);
    expect(await quals.isAffordanceVisible(quals.scrollButton)).toBe(false);
    expect(await quals.isAffordanceVisible(quals.topFade)).toBe(false);
  });
});
