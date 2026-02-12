
import { expect, test } from '@playwright/test';

test('Slide00 starts with HUD/diagnostics hidden, toggles reveal overlays, and arm flow stays deterministic', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('slide00-boot-console')).toBeVisible();
  await expect(page.getByTestId('boot-panel')).toBeVisible();
  await expect(page.getByTestId('boot-status-badge')).toContainText('SYSTEM: LOCKED');
  await expect(page.getByTestId('boot-armed-evidence')).toHaveText('missing');
  await expect(page.getByTestId('boot-gate-state')).toContainText('gateLocked:true');

  await expect(page.getByTestId('controlbar')).toHaveCount(0);
  await expect(page.getByTestId('top-ribbon-operator-overlay')).toHaveCount(0);
  await expect(page.getByTestId('wow-diagnostics')).toHaveCount(0);

  await expect(page.getByTestId('view-toggle-top-hud')).not.toBeChecked();
  await expect(page.getByTestId('view-toggle-top-ribbon')).not.toBeChecked();
  await expect(page.getByTestId('view-toggle-diagnostics')).not.toBeChecked();

  await page.getByTestId('view-toggle-top-hud').check();
  await expect(page.getByTestId('controlbar')).toBeVisible();

  await page.getByTestId('view-toggle-top-ribbon').check();
  await expect(page.getByTestId('top-ribbon-operator-overlay')).toBeVisible();

  await page.getByTestId('view-toggle-diagnostics').check();
  await expect(page.getByTestId('wow-diagnostics')).toBeVisible();
  await expect(page.getByTestId('boot-operator-dock-toggle')).toBeVisible();

  await page.getByTestId('boot-operator-dock-toggle').click();
  await expect(page.getByTestId('boot-operator-dock')).toBeVisible();

  await page.getByTestId('diagnostics-dock-mode-toggle').click();
  await expect(page.getByTestId('boot-operator-dock')).toBeVisible();

  await page.getByTestId('boot-operator-dock-close').click();
  await expect(page.getByTestId('boot-operator-dock')).toHaveCount(0);

  await expect(page.getByTestId('tour-overlay')).toHaveCount(0);
  await expect(page.getByTestId('tour-launch')).toHaveCount(0);

  await page.getByTestId('boot-arm-button').click();
  await expect(page.getByTestId('boot-state-label')).toHaveText('ARMED_PENDING_CONFIRM');

  await page.getByTestId('boot-confirm-button').click();

  await expect(page.getByTestId('boot-status-badge')).toContainText('SYSTEM: ARMED');
  await expect(page.getByTestId('boot-toast')).toContainText('sistema listo');
  await expect(page.getByTestId('boot-armed-evidence')).toHaveText('satisfied');
  await expect(page.getByTestId('boot-gate-state')).toContainText('armed:true');
  await expect(page.getByTestId('tour-launch')).toBeVisible();
  await expect(page.getByTestId('tour-overlay')).toHaveCount(0);

  await expect(page.getByTestId('boot-feature-state')).toContainText('demoScriptAvailable:true');
  await expect(page.getByTestId('boot-feature-state')).toContainText('demoScriptActive:false');
});

test('Operator override keeps evidence unsatisfied and diagnostics back button exits cleanly', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('view-toggle-diagnostics').check();
  await expect(page.getByTestId('boot-operator-dock-toggle')).toBeVisible();

  await page.getByTestId('boot-operator-dock-toggle').click();
  await expect(page.getByTestId('boot-operator-dock')).toBeVisible();

  await page.getByTestId('operator-override-toggle').click();

  await expect(page.getByTestId('boot-state-label')).toHaveText('OPERATOR_ASSISTED');
  await expect(page.getByTestId('boot-armed-evidence')).toHaveText('missing');
  await expect(page.getByTestId('boot-gate-state')).toContainText('operatorAssisted:true');
  await expect(page.getByTestId('boot-gate-state')).toContainText('armed:false');
  await expect(page.getByTestId('tour-launch')).toBeVisible();
  await expect(page.getByTestId('operator-log-row').first()).toContainText('boot:override:enabled');

  await page.getByTestId('boot-operator-dock-close').click();
  await expect(page.getByTestId('boot-operator-dock')).toHaveCount(0);
});

