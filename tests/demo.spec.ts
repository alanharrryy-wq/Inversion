import { expect, test } from '@playwright/test';

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

test('tour overlay autostarts and renders first enterprise step', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('tour-overlay')).toBeVisible();
  await expect(page.getByText('Step 1 - Anchor the operating thesis')).toBeVisible();
});
