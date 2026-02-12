import { expect, test } from "@playwright/test";

const gotoSlide03 = async (page: import("@playwright/test").Page) => {
  await page.goto("/");

  await expect(page.getByTestId("deck-root")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  await expect(page.getByTestId("slide03-root")).toBeVisible();
  await expect(page.getByTestId("slide03-scene")).toBeVisible();
};

const dragArmCard = async (
  page: import("@playwright/test").Page,
  step: "e1" | "e2" | "e3"
) => {
  const gesture = page.getByTestId(`slide03-card-${step}-gesture`);
  const confirm = page.getByTestId(`slide03-card-${step}-confirm`);
  await expect(gesture).toBeVisible();
  await gesture.click();

  if (await confirm.isEnabled()) {
    return;
  }

  const box = await gesture.boundingBox();
  if (!box) {
    throw new Error(`No bounding box for ${step}`);
  }

  const y = box.y + box.height / 2;
  const startX = box.x + 8;
  const endX = box.x + box.width - 8;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y);
  await page.mouse.up();

  await expect(confirm).toBeEnabled();
};

test("Slide03 evidence ladder seals deterministically and replay preserves seal", async ({ page }) => {
  await gotoSlide03(page);

  await expect(page.getByTestId("slide03-stage-chip")).toContainText("idle");
  await expect(page.getByTestId("slide03-seal-level")).toHaveText(/open|forming/i);

  await dragArmCard(page, "e1");
  await page.getByTestId("slide03-card-e1-confirm").click();
  await expect(page.getByTestId("slide03-stage-chip")).toContainText("step1");

  await dragArmCard(page, "e2");
  await page.getByTestId("slide03-card-e2-confirm").click();
  await expect(page.getByTestId("slide03-stage-chip")).toContainText("step2");

  await dragArmCard(page, "e3");
  await page.getByTestId("slide03-card-e3-confirm").click();
  await expect(page.getByTestId("slide03-stage-chip")).toContainText("step3");

  await expect(page.getByTestId("slide03-seal-commit")).toBeEnabled();
  await page.getByTestId("slide03-seal-commit").click();

  await expect(page.getByTestId("slide03-stage-chip")).toContainText("sealed");
  await expect(page.getByTestId("slide03-seal-level")).toHaveText("sealed");
  await expect(page.getByTestId("slide03-confidence-score")).toHaveText(/\d+/);

  const confidenceValue = Number(
    (await page.getByTestId("slide03-confidence-score").textContent())?.trim() ?? "0"
  );
  expect(confidenceValue).toBeGreaterThanOrEqual(85);

  await page.getByTestId("slide03-replay-build").click();
  await expect(page.getByTestId("slide03-replay-textarea")).not.toHaveValue("");

  await page.getByTestId("slide03-replay-play").click();

  await expect(page.getByTestId("slide03-stage-chip")).toContainText("sealed");
  await expect(page.getByTestId("slide03-seal-level")).toHaveText("sealed");
  await expect(page.getByTestId("slide03-replay-last-result")).toContainText(/Replay executed/i);
});
