import { strict as assert } from "node:assert";

export const assertEqual = <T>(actual: T, expected: T, message: string) => {
  assert.equal(actual, expected, message);
};

export const assertDeepEqual = <T>(actual: T, expected: T, message: string) => {
  assert.deepEqual(actual, expected, message);
};

export const assertTruthy = (value: unknown, message: string) => {
  assert.ok(value, message);
};

export const assertGreaterOrEqual = (actual: number, expected: number, message: string) => {
  assert.ok(actual >= expected, `${message} | actual=${actual} expected>=${expected}`);
};

export const assertLessOrEqual = (actual: number, expected: number, message: string) => {
  assert.ok(actual <= expected, `${message} | actual=${actual} expected<=${expected}`);
};

export const assertMonotonicIncrease = (values: number[], label: string) => {
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(
      values[i] >= values[i - 1],
      `${label} not monotonic increase at index ${i}: ${values[i - 1]} -> ${values[i]}`
    );
  }
};

export const assertMonotonicDecrease = (values: number[], label: string) => {
  for (let i = 1; i < values.length; i += 1) {
    assert.ok(
      values[i] <= values[i - 1],
      `${label} not monotonic decrease at index ${i}: ${values[i - 1]} -> ${values[i]}`
    );
  }
};

export const section = (name: string) => {
  process.stdout.write(`[slide03-unit] ${name}\n`);
};
