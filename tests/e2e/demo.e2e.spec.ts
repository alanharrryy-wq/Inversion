import { expect, test } from '@playwright/test';

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
      if (!/\.(ts|tsx|css)$/.test(entry)) continue;
      files.push(fullPath);
    }
  }

  files.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return files;
}

function assertSlide13NoTimers() {
  const domainRoot = path.join(
    process.cwd(),
    'components',
    'slides',
    'slide13-ui',
    'routeb'
  );
  const files = collectDomainFiles(domainRoot);
  expect(files.length).toBeGreaterThan(0);
  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    expect(content).not.toMatch(/\bsetTimeout\s*\(/);
    expect(content).not.toMatch(/\bsetInterval\s*\(/);
  }
}

async function goToSlide13(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId('deck-root')).toBeVisible();
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('ArrowRight');
  }
  await expect(page.getByTestId('slide13-root')).toBeVisible();
}
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { SLIDE07_REPLAY_FIXTURES, SLIDE07_SMOKE_FIXTURES } from '../../components/slides/slide07-ui/routeb/slide07.fixtures';
import {
  assertSlide07ReplayDeterminism,
  runSlide07FixtureReplay,
} from '../../components/slides/slide07-ui/routeb/slide07.replay';

function collectSlide07DomainFiles(rootDir: string): string[] {
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
      if (!/\.(ts|tsx)$/.test(entry)) {
        continue;
      }
      files.push(fullPath);
    }
  }

  files.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  return files;
}

function assertNoTimersInSlide07Domain() {
  const domainRoot = path.join(process.cwd(), 'components', 'slides', 'slide07-ui', 'routeb');
  const files = collectSlide07DomainFiles(domainRoot);

  expect(files.length).toBeGreaterThan(0);

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    expect(content).not.toMatch(/\bsetTimeout\s*\(/);
    expect(content).not.toMatch(/\bsetInterval\s*\(/);
  }
}

test('app loads and core layout exists without severe console errors', async ({ page }) => {
  const severe = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!/favicon|Failed to load resource/i.test(text)) {
        severe.push(text);
      }
    }
  });

  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByTestId('deck-root')).toBeVisible();
  expect(severe).toEqual([]);
});

test('F1-F4 hotkeys update visible mode state', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('controlbar')).toHaveCount(0);
  await page.getByTestId('view-toggle-top-hud').check();
  await expect(page.getByTestId('controlbar')).toBeVisible();

  const modeState = page.getByTestId('global-mode-state');
  await expect(modeState).toHaveText(/stealth:off/);

  await page.keyboard.press('F1');
  await expect(modeState).toHaveText(/stealth:on/);

  await page.keyboard.press('F2');
  await expect(modeState).toHaveText(/track:off/);

  await page.keyboard.press('F3');
  await expect(modeState).toHaveText(/lock:on/);

  await page.keyboard.press('F4');
  await expect(modeState).toHaveText(/autoplay:on/);
});

test('AI chat roundtrip uses deterministic stub and voice defaults off', async ({ page }) => {
  const apiPaths = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) {
      apiPaths.push(url.pathname);
    }
  });

  await page.goto('/');
  await page.getByTestId('chat-toggle').click();
  await expect(page.getByTestId('chat-window')).toBeVisible();

  await page.getByTestId('chat-input').fill('demo ping from playwright');
  await page.getByTestId('chat-send').click();
  await expect(page.getByTestId('chat-msg-model').last()).toContainText('[AI_BACKEND:demo_test_mode]');
  await expect.poll(() => apiPaths.filter((path) => path === '/api/ai').length).toBeGreaterThan(0);
  expect(apiPaths.includes('/api/gemini')).toBeFalsy();

  await page.getByTestId('chat-mode').selectOption('voice');
  await expect(page.getByTestId('chat-voice-btn')).toContainText('VOICE MODE UNAVAILABLE');
});

test('tour remains manual-only until operator starts it', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('slide00-boot-console')).toBeVisible();
  await expect(page.getByTestId('tour-overlay')).toHaveCount(0);
  await expect(page.getByTestId('boot-gate-state')).toContainText('gateLocked:true');

  await page.getByTestId('boot-arm-button').click();
  await expect(page.getByTestId('boot-state-label')).toHaveText('ARMED_PENDING_CONFIRM');
  await page.getByTestId('boot-confirm-button').click();

  await expect(page.getByTestId('boot-status-badge')).toContainText('SYSTEM: ARMED');
  await expect(page.getByTestId('boot-toast')).toContainText('sistema listo');
  await expect(page.getByTestId('tour-launch')).toBeVisible();
  await expect(page.getByTestId('tour-overlay')).toHaveCount(0);

  await page.getByTestId('tour-launch').getByRole('button', { name: 'Start Tour' }).click();
  await expect(page.getByTestId('tour-overlay')).toBeVisible();
  await expect(page.getByText('Step 1 - Frame the decision lens')).toBeVisible();
});

test('Slide13 Route B seals by drag hold release', async ({ page }) => {
  await goToSlide13(page);

  await expect(page.getByTestId('slide13-rail')).toBeVisible();
  await expect(page.getByTestId('slide13-rail-step-drag')).toBeVisible();
  await expect(page.getByTestId('slide13-rail-step-hold')).toBeVisible();
  await expect(page.getByTestId('slide13-rail-step-release')).toBeVisible();
  await expect(page.getByTestId('slide13-seal')).toHaveAttribute('data-sealed', 'false');

  const dragSurface = page.getByTestId('slide13-gesture-drag');
  await expect(dragSurface).toBeVisible();

  const box = await dragSurface.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  const startX = box.x + 64;
  const startY = box.y + box.height * 0.64;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 240, startY, { steps: 18 });
  await page.mouse.move(startX + 240, startY + 92, { steps: 10 });
  await page.mouse.move(startX + 178, startY + 92, { steps: 8 });
  await page.mouse.move(startX + 240, startY - 86, { steps: 10 });
  await page.mouse.move(startX + 170, startY - 86, { steps: 8 });
  await page.mouse.move(startX + 240, startY + 88, { steps: 10 });
  await page.mouse.move(startX + 176, startY + 88, { steps: 8 });
  await page.mouse.move(startX + 240, startY - 84, { steps: 10 });
  await page.mouse.up();

  await expect(page.getByTestId('slide13-seal')).toHaveAttribute('data-sealed', 'true');
  await expect(page.getByTestId('slide13-seal-state')).toContainText('RightSeal colapsado');
  await expect(page.getByTestId('slide13-gesture-hold')).toContainText('freeze on');
  await expect(page.getByTestId('slide13-gesture-release')).toContainText('release 100%');

  assertSlide13NoTimers();
});

test('Slide07 Route B fixtures stay deterministic and timer-free', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('deck-root')).toBeVisible();

  expect(SLIDE07_REPLAY_FIXTURES.length).toBeGreaterThanOrEqual(200);

  for (const fixture of SLIDE07_SMOKE_FIXTURES) {
    const assertion = runSlide07FixtureReplay(fixture);
    expect(assertion.passedStage, fixture.id + ' stage').toBeTruthy();
    expect(assertion.passedEvidence, fixture.id + ' evidence').toBeTruthy();
    expect(assertion.passedEvents, fixture.id + ' events').toBeTruthy();

    const deterministic = assertSlide07ReplayDeterminism(fixture, 3);
    expect(deterministic.deterministic, fixture.id + ' deterministic').toBeTruthy();
  }

  assertNoTimersInSlide07Domain();
});

test('Slide07 smoke interacts with Route B gesture contract when mounted', async ({ page }) => {
  await page.goto('/');

  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press('ArrowRight');
  }

  const ritualRoot = page.getByTestId('slide07-root');
  const mounted = (await ritualRoot.count()) > 0;

  if (!mounted) {
    return;
  }

  const dragSurface = page.getByTestId('slide07-gesture-drag');
  await expect(dragSurface).toBeVisible();

  const box = await dragSurface.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    return;
  }

  const startX = box.x + 44;
  const startY = box.y + box.height * 0.46;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 210, startY - 2, { steps: 16 });
  await page.mouse.move(startX + 216, startY + 6, { steps: 10 });
  await page.mouse.up();

  await expect(page.getByTestId('slide07-seal-state')).toContainText(/Graph sealed/i);
});
