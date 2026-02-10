import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function normalize(relPath: string): string {
  return relPath.replace(/\\/g, '/');
}

function walk(dir: string): string[] {
  const stack = [dir];
  const files: string[] = [];
  const excluded = new Set(['.git', 'node_modules', 'dist', 'build', '.run', '.next', '.vite', 'coverage']);

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (!excluded.has(entry)) stack.push(full);
        continue;
      }
      files.push(normalize(path.relative(repoRoot, full)));
    }
  }

  return files;
}

function test_playwright_config_scope() {
  const content = readFileSync(path.join(repoRoot, 'playwright.config.ts'), 'utf8');
  assert.match(content, /testDir\s*:\s*['"]\.\/tests\/e2e['"]/);
  assert.match(content, /testMatch\s*:\s*\[[^\]]*e2e\.spec\.ts[^\]]*\]/s);
}

function test_e2e_specs_are_confined() {
  const files = walk(repoRoot);
  const e2eSpecs = files.filter((rel) => rel.endsWith('.e2e.spec.ts'));
  assert.ok(e2eSpecs.length > 0);
  assert.equal(e2eSpecs.every((rel) => rel.startsWith('tests/e2e/')), true);
}

export function runPlaywrightHarnessSpecs(): void {
  test_playwright_config_scope();
  test_e2e_specs_are_confined();
}
