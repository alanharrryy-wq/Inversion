import { strict as assert } from "node:assert";

export type TestCase = {
  id: string;
  run: () => void;
};

export interface TestSuiteResult {
  suite: string;
  passed: number;
  failed: number;
  failures: Array<{ id: string; error: string }>;
}

export function expectWithinRange(value: number, range: [number, number], message: string): void {
  const [min, max] = range;
  assert.equal(Number.isFinite(value), true, `${message}: value is not finite`);
  assert.equal(value >= min, true, `${message}: ${value} < ${min}`);
  assert.equal(value <= max, true, `${message}: ${value} > ${max}`);
}

export function expectStringContains(value: string, expected: string, message: string): void {
  assert.equal(value.includes(expected), true, `${message}: expected "${expected}" in "${value}"`);
}

export function expectNonEmpty(value: string, message: string): void {
  assert.equal(typeof value, "string", `${message}: value is not a string`);
  assert.equal(value.trim().length > 0, true, `${message}: value is empty`);
}

export function runSuite(suiteName: string, cases: TestCase[]): TestSuiteResult {
  const failures: Array<{ id: string; error: string }> = [];

  cases.forEach((item) => {
    try {
      item.run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ id: item.id, error: message });
    }
  });

  return {
    suite: suiteName,
    passed: cases.length - failures.length,
    failed: failures.length,
    failures,
  };
}

export function printSuiteResult(result: TestSuiteResult): void {
  const status = result.failed === 0 ? "PASS" : "FAIL";
  console.log(`[slide02-unit] ${status} ${result.suite} passed=${result.passed} failed=${result.failed}`);

  if (result.failed > 0) {
    result.failures.forEach((failure) => {
      console.log(`[slide02-unit]   ${failure.id} :: ${failure.error}`);
    });
  }
}

export function assertAllPass(results: TestSuiteResult[]): void {
  const failed = results.filter((result) => result.failed > 0);
  if (failed.length === 0) {
    return;
  }

  const summary = failed
    .map((result) => `${result.suite} failed=${result.failed}`)
    .join(", ");

  throw new Error(`Slide02 unit suite failed: ${summary}`);
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
