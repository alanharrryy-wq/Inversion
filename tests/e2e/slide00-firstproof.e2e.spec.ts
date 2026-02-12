import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

function collectDomainFiles(rootDir: string): string[] {
  const stack = [rootDir];
  const files: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop() as string;

    for (const entry of readdirSync(current)) {
      const fullPath = path.join(current, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!/\.(ts|tsx|css)$/.test(entry)) {
        continue;
      }

      files.push(fullPath);
    }
  }

  files.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return files;
}

function assertNoTimersInFirstProofDomain() {
  const domainRoot = path.join(
    process.cwd(),
    "components",
    "slides",
    "slide00-ui",
    "first-proof"
  );

  const files = collectDomainFiles(domainRoot);
  expect(files.length).toBeGreaterThan(0);

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8");
    expect(content).not.toMatch(/\bsetTimeout\s*\(/);
    expect(content).not.toMatch(/\bsetInterval\s*\(/);
  }
}

test("Slide00 First Proof ritual seals with drag-hold-release and RightSeal collapses", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("slide00-firstproof-root")).toBeVisible();
  await expect(page.getByTestId("slide00-firstproof-step-drag")).toBeVisible();
  await expect(page.getByTestId("slide00-firstproof-step-hold")).toBeVisible();
  await expect(page.getByTestId("slide00-firstproof-step-release")).toBeVisible();

  await expect(page.getByTestId("slide00-rightseal-state")).toContainText("Ejecución incompleta");

  const dragSurface = page.getByTestId("slide00-firstproof-gesture-drag");
  await expect(dragSurface).toBeVisible();

  const box = await dragSurface.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + 30;
  const startY = box.y + box.height * 0.48;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  await page.mouse.move(startX + 140, startY + 2, { steps: 14 });
  await page.mouse.move(startX + 306, startY + 4, { steps: 22 });
  await page.mouse.move(startX + 310, startY + 7, { steps: 4 });
  await page.mouse.move(startX + 306, startY + 5, { steps: 4 });
  await page.waitForTimeout(2200);
  await page.mouse.up();

  await expect(page.getByTestId("slide00-rightseal")).toHaveAttribute("data-sealed", "true");
  await expect(page.getByTestId("slide00-rightseal")).toHaveAttribute("data-collapsed", "true");
  await expect(page.getByTestId("slide00-rightseal-state")).toContainText("Sistema sellado");
  await expect(page.getByTestId("slide00-rightseal")).toContainText(
    "Fue diseñado para ser posible… hoy, mañana y cuando tú ya no estés aquí operándolo."
  );

  assertNoTimersInFirstProofDomain();
});

test("Slide00 First Proof keeps release blocked if hold threshold is missing", async ({ page }) => {
  await page.goto("/");

  const dragSurface = page.getByTestId("slide00-firstproof-gesture-drag");
  const box = await dragSurface.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + 24;
  const startY = box.y + box.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 220, startY + 4, { steps: 16 });
  await page.waitForTimeout(220);
  await page.mouse.up();

  await expect(page.getByTestId("slide00-rightseal")).toHaveAttribute("data-sealed", "false");
  await expect(page.getByTestId("slide00-rightseal-state")).toContainText("Intención registrada");
  await expect(page.getByTestId("slide00-rightseal")).toContainText("El panel juzga ejecución. No explica.");

  assertNoTimersInFirstProofDomain();
});
