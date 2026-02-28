import { strict as assert } from 'node:assert';
import {
  SLIDE_SCHEMA,
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
  assert.equal(getSlideComponentForSlot(7), 'Slide7');
  assert.equal(getSlideComponentForSlot(11), 'Slide12');
  assert.equal(getSlideComponentForSlot(16), 'Slide16_Investor');
}

function test_adapter_resolves_all_twenty_slots(): void {
  const componentMap = buildStubComponentMap();
  const resolved = Array.from({ length: 20 }, (_, slot) => resolveSlideComponentForSlot(slot, componentMap));
  assert.equal(resolved.length, 20);
  assert.equal(resolved.every((item) => typeof item === 'string' && item.length > 0), true);
  assert.equal(resolved[7], 'component:Slide7');
  assert.equal(resolved[11], 'component:Slide12');
  assert.equal(resolved[16], 'component:Slide16_Investor');
}

function test_invariant_accepts_current_registry_shape(): void {
  assert.doesNotThrow(() =>
    assertSlideRegistryInvariant({
      expectedSlotCount: 20,
      availableComponentExports: uniqueMountedExports(),
    })
  );
}

export function runSlideRegistryAdapterSpecs(): void {
  test_slot_component_exports_match_locked_behavior();
  test_adapter_resolves_all_twenty_slots();
  test_invariant_accepts_current_registry_shape();
}

