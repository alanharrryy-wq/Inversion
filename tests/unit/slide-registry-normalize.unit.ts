import { strict as assert } from 'node:assert';
import { normalizeSlideRef } from '../../runtime/slides/contracts';

function test_normalizes_slot_seven_aliases(): void {
  assert.equal(normalizeSlideRef('Slide7'), '07');
  assert.equal(normalizeSlideRef('Slide07'), '07');
  assert.equal(normalizeSlideRef('7'), '07');
  assert.equal(normalizeSlideRef('07'), '07');
}

function test_normalizes_slot_eleven_transitional_aliases(): void {
  assert.equal(normalizeSlideRef('Slide12'), '11');
  assert.equal(normalizeSlideRef('Slide11'), '11');
  assert.equal(normalizeSlideRef('11'), '11');
}

function test_unknown_refs_return_null(): void {
  assert.equal(normalizeSlideRef('Slide99'), null);
  assert.equal(normalizeSlideRef('99'), null);
  assert.equal(normalizeSlideRef('unknown'), null);
  assert.equal(normalizeSlideRef({}), null);
}

export function runSlideRegistryNormalizeSpecs(): void {
  test_normalizes_slot_seven_aliases();
  test_normalizes_slot_eleven_transitional_aliases();
  test_unknown_refs_return_null();
}

