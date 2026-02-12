import { expect, test } from "@playwright/test";

test("deck nav smoke: Slide00 to Slide04 and back to Slide03", async ({ page }) => {
  await page.goto("/slides/00");

  await expect(page.getByTestId("slide-00-root")).toBeVisible();
  await expect(page.getByTestId("nav-prev")).toBeDisabled();
  await expect(page.getByTestId("nav-current-index")).toHaveText("00");
  await expect(page.getByTestId("nav-current-id")).toHaveText("slide-00");

  await page.getByTestId("nav-next").click();
  await expect(page.getByTestId("slide-01-root")).toBeVisible();
  await expect(page.getByTestId("nav-current-index")).toHaveText("01");
  await expect(page.getByTestId("nav-current-id")).toHaveText("slide-01");

  await page.getByTestId("nav-next").click();
  await expect(page.getByTestId("slide-02-root")).toBeVisible();
  await expect(page.getByTestId("nav-current-index")).toHaveText("02");
  await expect(page.getByTestId("nav-current-id")).toHaveText("slide-02");

  await page.getByTestId("nav-next").click();
  await expect(page.getByTestId("slide-03-root")).toBeVisible();
  await expect(page.getByTestId("nav-current-index")).toHaveText("03");
  await expect(page.getByTestId("nav-current-id")).toHaveText("slide-03");

  await page.getByTestId("nav-next").click();
  await expect(page.getByTestId("slide-04-root")).toBeVisible();
  await expect(page.getByTestId("nav-current-index")).toHaveText("04");
  await expect(page.getByTestId("nav-current-id")).toHaveText("slide-04");
  await expect(page.getByTestId("nav-next")).toBeDisabled();

  await page.getByTestId("nav-prev").click();
  await expect(page.getByTestId("slide-03-root")).toBeVisible();
  await expect(page.getByTestId("nav-current-index")).toHaveText("03");
  await expect(page.getByTestId("nav-current-id")).toHaveText("slide-03");
});
