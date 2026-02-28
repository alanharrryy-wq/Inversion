import { strict as assert } from 'node:assert';
import { normalizeSlideRef } from '../../runtime/slides/contracts';

function test_normalizes_canonical_and_alias_refs(): void {
  assert.equal(normalizeSlideRef('Slide07'), '07');
  assert.equal(normalizeSlideRef('projection'), '08');
  assert.equal(normalizeSlideRef('Slide09'), '09');
  assert.equal(normalizeSlideRef('7'), '07');
  assert.equal(normalizeSlideRef('07'), '07');
}

function test_normalizes_catalog_mapped_components(): void {
  assert.equal(normalizeSlideRef('Slide13'), '12');
  assert.equal(normalizeSlideRef('kpi-ritual'), '12');
  assert.equal(normalizeSlideRef('11'), '11');
}

function test_unknown_refs_return_null(): void {
  assert.equal(normalizeSlideRef('Slide99'), null);
  assert.equal(normalizeSlideRef('99'), null);
  assert.equal(normalizeSlideRef('unknown'), null);
  assert.equal(normalizeSlideRef({}), null);
}

export function runSlideRegistryNormalizeSpecs(): void {
  test_normalizes_canonical_and_alias_refs();
  test_normalizes_catalog_mapped_components();
  test_unknown_refs_return_null();
}
