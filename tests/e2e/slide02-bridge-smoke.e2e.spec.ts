import { expect, test } from "@playwright/test";

test("Slide02 bridge smoke: constraint tightening updates deterministic evidence and replay apply is stable", async ({ page }) => {
  const severe: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/favicon|Failed to load resource/i.test(text)) return;
    severe.push(text);
  });

  await page.goto("/");

  // Navigate from Slide00 -> Slide01 -> Slide02 using deck next controls.
  await page.getByRole("button", { name: /NEXT/i }).click();
  await page.getByRole("button", { name: /NEXT/i }).click();

  await expect(page.getByTestId("slide02-root")).toBeVisible();
  await expect(page.getByTestId("slide02-controls-panel")).toBeVisible();
  await expect(page.getByTestId("slide02-evidence-panel")).toBeVisible();

  const initialSignature = (await page.getByTestId("slide02-response-signature").innerText()).trim();
  await expect(page.getByTestId("slide02-status-value")).toContainText("Bootstrapped");
  await expect(page.getByTestId("slide02-trace-length")).toHaveText("1");

  await page.getByTestId("slide02-route-select").selectOption("margin-defense");
  await page.getByTestId("slide02-strictness-slider").fill("78");
  await page.getByTestId("slide02-budget-slider").fill("75");

  await expect(page.getByTestId("slide02-status-value")).toContainText("Interactive");
  await expect(page.getByTestId("slide02-decision-chip")).toContainText(/PROCEED|PROCEED\+/i);
  await expect(page.getByTestId("slide02-evidence-row-route")).toContainText("Margin Defense");

  const updatedSignature = (await page.getByTestId("slide02-response-signature").innerText()).trim();
  expect(updatedSignature).not.toBe(initialSignature);

  await page.getByTestId("slide02-replay-export").click();

  const replayJson = (await page.getByTestId("slide02-replay-textarea").inputValue()).trim();
  expect(replayJson.length).toBeGreaterThan(20);
  expect(replayJson).toContain("slide02.replay.v1");

  await page.getByTestId("slide02-replay-stage").click();
  await expect(page.getByTestId("slide02-status-value")).toContainText("Replay Ready");

  await page.getByTestId("slide02-replay-apply").click();
  await expect(page.getByTestId("slide02-status-value")).toContainText("Replay Applied");

  const finalSignature = (await page.getByTestId("slide02-response-signature").innerText()).trim();
  expect(finalSignature.length).toBeGreaterThan(0);
  expect(finalSignature).toBe(updatedSignature);

  await page.getByTestId("slide02-hud-toggle").click();
  await expect(page.getByTestId("slide02-hud")).toBeVisible();
  await expect(page.getByTestId("slide02-hud-signature")).toContainText(finalSignature);

  expect(severe).toEqual([]);
});
