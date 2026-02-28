import { strict as assert } from 'node:assert';
import {
  SLIDE_SCHEMA,
  SLIDE_SLOT_COUNT,
  assertSlideRegistryInvariant,
  getSlideComponentForSlot,
  resolveSlideComponentForSlot,
} from '../../runtime/slides/contracts';

function uniqueMountedExports(): string[] {
  return Array.from(new Set(SLIDE_SCHEMA.map((entry) => entry.componentExport))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function buildStubComponentMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const exportName of uniqueMountedExports()) {
    map[exportName] = `component:${exportName}`;
  }
  return map;
}

function test_slot_component_exports_match_locked_behavior(): void {
  assert.equal(getSlideComponentForSlot(7), 'Slide07');
  assert.equal(getSlideComponentForSlot(8), 'Slide12');
  assert.equal(getSlideComponentForSlot(9), 'Slide09InvestmentModel');
  assert.equal(getSlideComponentForSlot(12), 'Slide13');
}

function test_adapter_resolves_all_catalog_slots(): void {
  const componentMap = buildStubComponentMap();
  const resolved = Array.from({ length: SLIDE_SLOT_COUNT }, (_, slot) => resolveSlideComponentForSlot(slot, componentMap));
  assert.equal(resolved.length, SLIDE_SLOT_COUNT);
  assert.equal(resolved.every((item) => typeof item === 'string' && item.length > 0), true);
  assert.equal(resolved[7], 'component:Slide07');
  assert.equal(resolved[8], 'component:Slide12');
  assert.equal(resolved[9], 'component:Slide09InvestmentModel');
  assert.equal(resolved[12], 'component:Slide13');
}

function test_invariant_accepts_current_registry_shape(): void {
  assert.doesNotThrow(() =>
    assertSlideRegistryInvariant({
      expectedSlotCount: SLIDE_SLOT_COUNT,
      availableComponentExports: uniqueMountedExports(),
    })
  );
}

export function runSlideRegistryAdapterSpecs(): void {
  test_slot_component_exports_match_locked_behavior();
  test_adapter_resolves_all_catalog_slots();
  test_invariant_accepts_current_registry_shape();
}
