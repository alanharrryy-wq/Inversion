import { expect, test } from "@playwright/test";

test("Slide01 route selector resolves deterministically and replay reproduces evidence", async ({
  page,
}) => {
  const severe: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/favicon|Failed to load resource/i.test(text)) return;
    severe.push(text);
  });

  await page.goto("/");
  await expect(page.getByTestId("deck-root")).toBeVisible();
  await expect(page.getByTestId("slide00-boot-console")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  if ((await page.getByTestId("slide01-scene").count()) === 0) {
    await page.getByRole("button", { name: /NEXT/i }).click();
  }

  await expect(page.getByTestId("slide01-scene")).toBeVisible();
  await expect(page.getByTestId("slide01-weigh-arena")).toBeVisible();
  await expect(page.getByTestId("slide01-outcome-headline")).toBeVisible();

  const arena = page.getByTestId("slide01-weigh-arena");
  const box = await arena.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const startX = box.x + box.width * 0.22;
  const startY = box.y + box.height * 0.44;
  const midX = box.x + box.width * 0.56;
  const midY = box.y + box.height * 0.63;
  const endX = box.x + box.width * 0.82;
  const endY = box.y + box.height * 0.78;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(midX, midY);
  await page.mouse.move(endX, endY);
  await page.mouse.up();

  await expect(page.getByTestId("slide01-outcome-headline")).toContainText("Route B selected");
  const winnerText = await page.getByTestId("slide01-outcome-headline").innerText();
  const scoreText = await page.getByTestId("slide01-outcome-score").innerText();
  await expect(page.getByTestId("slide01-trace-length")).toContainText("trace events:");
  await expect(page.getByTestId("slide01-trace-length")).not.toContainText("trace events: 0");

  await page.getByTestId("slide01-trace-export").click();
  const exportedTrace = await page.getByTestId("slide01-replay-input").inputValue();
  expect(exportedTrace).toContain("\"version\": \"slide01.trace.v1\"");

  await page.getByTestId("slide01-outcome-reset").click();
  await expect(page.getByTestId("slide01-outcome-headline")).toContainText("Pending deterministic");

  await page.getByTestId("slide01-replay-input").fill(exportedTrace);
  await page.getByTestId("slide01-replay-apply").click();

  await expect(page.getByTestId("slide01-outcome-headline")).toHaveText(winnerText);
  await expect(page.getByTestId("slide01-outcome-score")).toHaveText(scoreText);
  await expect(page.getByTestId("slide01-replay-status")).toContainText("replayed");

  expect(severe).toEqual([]);
});
