
import { strict as assert } from 'node:assert';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const guardScript = path.join(repoRoot, 'scripts', 'no-rework-guard.mjs');

function runGuard(targetRepo: string) {
  return spawnSync('node', [guardScript, '--repo-root', targetRepo], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  });
}

function test_guard_passes_on_repo() {
  const result = runGuard(repoRoot);
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
  }
  assert.equal(result.status, 0);
}

function test_guard_fails_for_reintroduced_overlap() {
  const tmpBase = mkdtempSync(path.join(os.tmpdir(), 'inversion-no-rework-'));
  const fixtureRoot = path.join(tmpBase, 'fixture');
  mkdirSync(fixtureRoot, { recursive: true });

  const write = (rel: string, content: string) => {
    const full = path.join(fixtureRoot, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  };

  try {
    write(
      'playwright.config.ts',
      `import { defineConfig } from '@playwright/test';\nexport default defineConfig({ testDir: './tests/e2e', testMatch: ['**/*.e2e.spec.ts'] });\n`,
    );
    write('wow/tour/choreo/choreo.types.ts', `export const legacy = true;\n`);
    write('wow/tour/ui/DirectorOverlay.tsx', `export const DirectorOverlay = () => null;\n`);
    write(
      'components/FakeClient.tsx',
      `import { emitGuideEvent } from '../wow/guide/events';\nexport function FakeClient() { emitGuideEvent('x'); return null; }\n`,
    );

    const result = runGuard(fixtureRoot);
    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /DUP_CHOREO_TYPES_FILE/);
    assert.match(output, /DUP_DIRECTOR_OVERLAY_FILE/);
    assert.match(output, /DEPRECATED_WOW_GUIDE_IMPORT/);
  } finally {
    rmSync(tmpBase, { recursive: true, force: true });
  }
}

export function runNoReworkGuardSpecs(): void {
  test_guard_passes_on_repo();
  test_guard_fails_for_reintroduced_overlap();
}

