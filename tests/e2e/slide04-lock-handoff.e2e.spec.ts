import { expect, test } from "@playwright/test";

test("Slide04 lock flow seals summary and replay playback reproduces hash", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("slide00-boot-console")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  await expect(page.getByTestId("s04-root")).toBeVisible();
  await expect(page.getByTestId("s04-summary-panel")).toBeVisible();

  await page.getByTestId("s04-route-card-route-service-led").click();
  await expect(page.getByTestId("s04-summary-phase")).toContainText("arming");

  const sealButton = page.getByTestId("s04-seal-action");
  await expect(sealButton).toBeVisible();

  const pointerId = 7;
  await sealButton.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "mouse",
    button: 0,
    buttons: 1,
    isPrimary: true,
  });
  await page.waitForTimeout(1350);
  await sealButton.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "mouse",
    button: 0,
    buttons: 0,
    isPrimary: true,
  });

  await expect(page.getByTestId("s04-summary-phase")).toContainText("sealed");
  await expect(page.getByTestId("s04-seal-output")).toBeVisible();
  await expect(page.getByTestId("s04-seal-hash")).toContainText(/hash:\s*[a-f0-9]{8}/i);

  const firstHash = ((await page.getByTestId("s04-seal-hash").textContent()) ?? "").trim();

  await page.getByTestId("s04-replay-playback").click();

  await expect(page.getByTestId("s04-replay-status")).toContainText("applied");
  await expect(page.getByTestId("s04-summary-phase")).toContainText("sealed");

  const replayHash = ((await page.getByTestId("s04-seal-hash").textContent()) ?? "").trim();
  expect(replayHash).toBe(firstHash);
});
