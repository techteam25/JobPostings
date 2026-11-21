import { expect, test } from "@playwright/test";

test.describe("Public signup information", () => {
  test("opens both legal pages without changing consent", async ({ page }) => {
    await page.goto("/sign-up");

    const consent = page.getByRole("checkbox", {
      name: /I agree to the Terms and Conditions and Privacy Policy/i,
    });
    await expect(consent).not.toBeChecked();

    for (const [label, path, heading] of [
      ["Terms & Conditions", "/terms", "Terms and Conditions"],
      ["Privacy Policy", "/privacy", "Privacy Policy"],
    ] as const) {
      const link = page.getByRole("link", { name: label });
      await expect(link).toBeVisible();
      await link.focus();
      const popupPromise = page.waitForEvent("popup");
      await page.keyboard.press("Enter");
      const legalPage = await popupPromise;
      await expect(legalPage).toHaveURL(new RegExp(`${path}$`));
      await expect(
        legalPage.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await legalPage.close();
      await expect(consent).not.toBeChecked();
    }
  });

  test("waits until email blur before showing a format error", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    const email = page.getByRole("textbox", { name: "Email Address" });

    await email.fill("jo");
    await expect(page.getByText("Invalid email address")).toBeHidden();
    await email.blur();
    await expect(page.getByText("Invalid email address")).toBeVisible();

    await email.fill("john@example.com");
    await email.blur();
    await expect(page.getByText("Invalid email address")).toBeHidden();
  });
});
