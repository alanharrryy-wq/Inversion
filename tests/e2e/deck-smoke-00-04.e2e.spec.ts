import { expect, test } from "@playwright/test";

test("deck nav smoke: Slide00 to Slide04 and back to Slide03", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");

  const printDiagnosticsOnFailure = async (rootTestId: string) => {
    const url = page.url();
    const navIndex = await page.getByTestId("nav-current-index").textContent().catch(() => null);
    const navId = await page.getByTestId("nav-current-id").textContent().catch(() => null);
    const slideTree = await page
      .locator(".deck-stage-frame")
      .first()
      .evaluate((el) => {
        const html = el.outerHTML;
        return html.length > 2000 ? `${html.slice(0, 2000)}...<truncated>` : html;
      })
      .catch(() => "deck-stage-frame not found");

    console.error(
      "[deck-smoke] root visibility diagnostics",
      JSON.stringify({ rootTestId, url, navIndex, navId, slideTree }, null, 2)
    );
  };

  const expectSlideState = async (indexText: string, idText: string, rootTestId: string) => {
    await expect(page.getByTestId("nav-current-index")).toHaveText(indexText, { timeout: 20000 });
    await expect(page.getByTestId("nav-current-id")).toHaveText(idText, { timeout: 20000 });
    try {
      await expect(page.getByTestId(rootTestId)).toBeVisible({ timeout: 20000 });
    } catch (error) {
      await page
        .screenshot({
          path: `test-results/deck-smoke-root-failure-${rootTestId}.png`,
          fullPage: true,
        })
        .catch(() => undefined);
      await printDiagnosticsOnFailure(rootTestId);
      throw error;
    }
  };

  await page.getByTestId("nav-jump-00").click();
  await expectSlideState("00", "slide-00", "slide-00-root");
  await expect(page.getByTestId("nav-prev")).toBeDisabled();

  await page.getByTestId("nav-next").click();
  await expectSlideState("01", "slide-01", "slide-01-root");

  await page.getByTestId("nav-next").click();
  await expectSlideState("02", "slide-02", "slide02-root");

  await page.getByTestId("nav-next").click();
  await expectSlideState("03", "slide-03", "slide03-root");

  await page.getByTestId("nav-next").click();
  await expectSlideState("04", "slide-04", "s04-root");
  await expect(page.getByTestId("nav-next")).toBeDisabled();

  await page.getByTestId("nav-prev").click();
  await expectSlideState("03", "slide-03", "slide03-root");
});

