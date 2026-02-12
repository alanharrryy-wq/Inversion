import { strict as assert } from "node:assert";
import {
  ensureRouteOrDefault,
  exportSeedSummary,
  resolveSlide02SeedContext,
  routeIdToHuman,
  routeSourceLabel,
  sanitizeRouteForReplay,
  Slide02ContextInput,
} from "./context";
import { createDefaultSeedContext } from "./model";
import { runSuite, expectStringContains } from "./test-utils";

type FakeStorageData = Record<string, string>;

class FakeStorage implements Storage {
  private data: FakeStorageData;

  constructor(seed: FakeStorageData = {}) {
    this.data = { ...seed };
  }

  get length(): number {
    return Object.keys(this.data).length;
  }

  clear(): void {
    this.data = {};
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.data);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }
}

function withWindowMock<T>(mockWindow: any, run: () => T): T {
  const original = (globalThis as any).window;
  (globalThis as any).window = mockWindow;

  try {
    return run();
  } finally {
    if (original === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = original;
    }
  }
}

function createWindowMock(seed?: {
  search?: string;
  historyState?: Record<string, unknown>;
  localStorage?: FakeStorageData;
  sessionStorage?: FakeStorageData;
  selectedRoute?: unknown;
  bundledSeed?: Partial<Slide02ContextInput>;
}) {
  return {
    location: {
      search: seed?.search ?? "",
    },
    history: {
      state: seed?.historyState ?? null,
    },
    localStorage: new FakeStorage(seed?.localStorage ?? {}),
    sessionStorage: new FakeStorage(seed?.sessionStorage ?? {}),
    __INVERSION_SELECTED_ROUTE__: seed?.selectedRoute,
    __INVERSION_SLIDE02_SEED__: seed?.bundledSeed,
  };
}

function test_default_seed_without_window() {
  const seed = withWindowMock(undefined, () => resolveSlide02SeedContext());

  assert.equal(seed.route, createDefaultSeedContext().route);
  assert.equal(seed.routeSource, "default");
  assert.deepEqual(seed.constraints, createDefaultSeedContext().constraints);
}

function test_manual_seed_input() {
  const manual = resolveSlide02SeedContext({
    route: "margin",
    routeSource: "external-payload",
    strictness: 88,
    budgetGuard: 74,
    latencyGuard: 20,
  });

  assert.equal(manual.route, "margin-defense");
  assert.equal(manual.routeSource, "external-payload");
  assert.equal(manual.constraints.strictness, 88);
  assert.equal(manual.constraints.budgetGuard, 74);
  assert.equal(manual.constraints.latencyGuard, 20);
}

function test_query_seed_resolution() {
  const mock = createWindowMock({
    search: "?route=throughput&strictness=67&budget=72&latency=31",
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.route, "throughput-push");
  assert.equal(seed.routeSource, "query");
  assert.equal(seed.constraints.strictness, 67);
  assert.equal(seed.constraints.budgetGuard, 72);
  assert.equal(seed.constraints.latencyGuard, 31);
}

function test_history_seed_resolution() {
  const mock = createWindowMock({
    historyState: {
      route: "quality",
      strict: 81,
      budget: 61,
      latency: 25,
    },
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.route, "quality-ringfence");
  assert.equal(seed.routeSource, "history");
  assert.equal(seed.constraints.strictness, 81);
  assert.equal(seed.constraints.budgetGuard, 61);
  assert.equal(seed.constraints.latencyGuard, 25);
}

function test_storage_seed_resolution() {
  const mock = createWindowMock({
    localStorage: {
      "inversion.selectedRoute": "margin-defense",
      "inversion.slide02.strictness": "69",
      "inversion.slide02.budget": "66",
      "inversion.slide02.latency": "19",
    },
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.route, "margin-defense");
  assert.equal(seed.routeSource, "local-storage");
  assert.equal(seed.constraints.strictness, 69);
  assert.equal(seed.constraints.budgetGuard, 66);
  assert.equal(seed.constraints.latencyGuard, 19);
}

function test_window_external_seed_resolution() {
  const mock = createWindowMock({
    selectedRoute: "quality",
    bundledSeed: {
      strictness: 73,
      budgetGuard: 70,
      latencyGuard: 22,
    },
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.route, "quality-ringfence");
  assert.equal(seed.routeSource, "external-payload");
  assert.equal(seed.constraints.strictness, 73);
  assert.equal(seed.constraints.budgetGuard, 70);
  assert.equal(seed.constraints.latencyGuard, 22);
}

function test_precedence_manual_over_query() {
  const mock = createWindowMock({
    search: "?route=throughput&strictness=61&budget=64&latency=37",
  });

  const seed = withWindowMock(mock, () =>
    resolveSlide02SeedContext({
      route: "quality",
      strictness: 91,
      budgetGuard: 88,
      latencyGuard: 14,
      routeSource: "external-payload",
    })
  );

  assert.equal(seed.route, "quality-ringfence");
  assert.equal(seed.routeSource, "external-payload");
  assert.equal(seed.constraints.strictness, 91);
  assert.equal(seed.constraints.budgetGuard, 88);
  assert.equal(seed.constraints.latencyGuard, 14);
}

function test_precedence_query_over_history_storage_window() {
  const mock = createWindowMock({
    search: "?route=margin&strictness=72&budget=74&latency=30",
    historyState: {
      route: "quality",
      strictness: 40,
      budgetGuard: 40,
      latencyGuard: 40,
    },
    localStorage: {
      "inversion.selectedRoute": "throughput-push",
      "inversion.slide02.strictness": "35",
      "inversion.slide02.budget": "35",
      "inversion.slide02.latency": "35",
    },
    selectedRoute: "stabilize-operations",
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.route, "margin-defense");
  assert.equal(seed.routeSource, "query");
  assert.equal(seed.constraints.strictness, 72);
  assert.equal(seed.constraints.budgetGuard, 74);
  assert.equal(seed.constraints.latencyGuard, 30);
}

function test_sanitized_constraints_from_seed_sources() {
  const mock = createWindowMock({
    search: "?route=throughput&strictness=150&budget=-40&latency=foo",
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.constraints.strictness, 100);
  assert.equal(seed.constraints.budgetGuard, 0);
  assert.equal(seed.constraints.latencyGuard, 38);
}

function test_route_source_labels() {
  assert.equal(routeSourceLabel("default"), "Fallback default");
  assert.equal(routeSourceLabel("query"), "URL query");
  assert.equal(routeSourceLabel("history"), "History state");
  assert.equal(routeSourceLabel("local-storage"), "Local storage");
  assert.equal(routeSourceLabel("external-payload"), "External payload");
}

function test_route_id_human_labels() {
  assert.equal(routeIdToHuman("stabilize-operations"), "Stabilize Operations");
  assert.equal(routeIdToHuman("throughput-push"), "Throughput Push");
  assert.equal(routeIdToHuman("margin-defense"), "Margin Defense");
  assert.equal(routeIdToHuman("quality-ringfence"), "Quality Ringfence");
}

function test_seed_summary_export() {
  const seed = {
    route: "throughput-push",
    routeSource: "query",
    constraints: { strictness: 67, budgetGuard: 72, latencyGuard: 31 },
  } as const;

  const summary = exportSeedSummary(seed as any);

  expectStringContains(summary, "route:throughput-push", "summary route");
  expectStringContains(summary, "source:query", "summary source");
  expectStringContains(summary, "strictness:67", "summary strictness");
  expectStringContains(summary, "budget:72", "summary budget");
  expectStringContains(summary, "latency:31", "summary latency");
}

function test_route_sanitizers() {
  assert.equal(sanitizeRouteForReplay("speed"), "throughput-push");
  assert.equal(sanitizeRouteForReplay("qa"), "quality-ringfence");

  assert.equal(ensureRouteOrDefault("margin"), "margin-defense");
  assert.equal(ensureRouteOrDefault("unknown"), "stabilize-operations");
  assert.equal(ensureRouteOrDefault(null), "stabilize-operations");

  assert.equal(
    ensureRouteOrDefault("unknown", "quality-ringfence"),
    "stabilize-operations"
  );
}

function test_session_storage_fallback() {
  const mock = createWindowMock({
    sessionStorage: {
      "hitech.route": "quality-ringfence",
      "hitech.slide02.strictness": "70",
      "hitech.slide02.budget": "68",
      "hitech.slide02.latency": "26",
    },
  });

  const seed = withWindowMock(mock, () => resolveSlide02SeedContext());

  assert.equal(seed.route, "quality-ringfence");
  assert.equal(seed.routeSource, "local-storage");
  assert.equal(seed.constraints.strictness, 70);
  assert.equal(seed.constraints.budgetGuard, 68);
  assert.equal(seed.constraints.latencyGuard, 26);
}

function test_manual_empty_object_does_not_break_defaults() {
  const seed = resolveSlide02SeedContext({});
  assert.equal(seed.route, "stabilize-operations");
  assert.equal(seed.constraints.strictness, 56);
  assert.equal(seed.constraints.budgetGuard, 62);
  assert.equal(seed.constraints.latencyGuard, 38);
}

function test_manual_partial_constraints() {
  const seed = resolveSlide02SeedContext({
    budgetGuard: 91,
  });

  assert.equal(seed.route, "stabilize-operations");
  assert.equal(seed.constraints.strictness, 56);
  assert.equal(seed.constraints.budgetGuard, 91);
  assert.equal(seed.constraints.latencyGuard, 38);
}

export function runSlide02ContextSpecs() {
  const result = runSuite("slide02-context", [
    { id: "default_seed_without_window", run: test_default_seed_without_window },
    { id: "manual_seed_input", run: test_manual_seed_input },
    { id: "query_seed_resolution", run: test_query_seed_resolution },
    { id: "history_seed_resolution", run: test_history_seed_resolution },
    { id: "storage_seed_resolution", run: test_storage_seed_resolution },
    { id: "window_external_seed_resolution", run: test_window_external_seed_resolution },
    { id: "precedence_manual_over_query", run: test_precedence_manual_over_query },
    { id: "precedence_query_over_history_storage_window", run: test_precedence_query_over_history_storage_window },
    { id: "sanitized_constraints_from_seed_sources", run: test_sanitized_constraints_from_seed_sources },
    { id: "route_source_labels", run: test_route_source_labels },
    { id: "route_id_human_labels", run: test_route_id_human_labels },
    { id: "seed_summary_export", run: test_seed_summary_export },
    { id: "route_sanitizers", run: test_route_sanitizers },
    { id: "session_storage_fallback", run: test_session_storage_fallback },
    { id: "manual_empty_object_does_not_break_defaults", run: test_manual_empty_object_does_not_break_defaults },
    { id: "manual_partial_constraints", run: test_manual_partial_constraints },
  ]);

  return result;
}
