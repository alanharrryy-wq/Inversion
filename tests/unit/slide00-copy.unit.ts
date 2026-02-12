import { strict as assert } from 'node:assert';
import { createCopyResolver } from '../../components/slides/slide00-ui/copy/getCopy';
import { esCopy } from '../../components/slides/slide00-ui/copy/es';

function test_interpolates_values() {
  const resolver = createCopyResolver({
    dictionaries: { es: esCopy },
    options: { locale: 'es', fallbackLocale: 'es' },
  });

  const value = resolver.t('slide00.header.rightBadge', { status: 'ARMED_CONFIRMED' });
  assert.equal(value, 'STATE ARMED_CONFIRMED');
}

function test_missing_key_placeholder_by_default() {
  const resolver = createCopyResolver({
    dictionaries: { es: esCopy },
    options: { locale: 'es', fallbackLocale: 'es' },
  });

  const missing = resolver.t('slide00.missing.this-key-does-not-exist');
  assert.equal(missing, '[missing-copy:slide00.missing.this-key-does-not-exist]');
}

function test_missing_key_can_throw() {
  const resolver = createCopyResolver({
    dictionaries: { es: esCopy },
    options: { locale: 'es', fallbackLocale: 'es', missingBehavior: 'throw' },
  });

  assert.throws(() => resolver.t('slide00.missing.must-throw'));
}

function test_enterprise_terms_remain_uppercase() {
  const resolver = createCopyResolver({
    dictionaries: {
      es: {
        ...esCopy,
        'test.enterprise': 'kpi y boot dependen de gate locked',
      },
    },
    options: { locale: 'es', fallbackLocale: 'es' },
  });

  const text = resolver.t('test.enterprise');
  assert.equal(text.includes('KPI'), true);
  assert.equal(text.includes('BOOT'), true);
  assert.equal(text.includes('GATE'), true);
  assert.equal(text.includes('LOCKED'), true);
}

export function runSlide00CopySpecs() {
  test_interpolates_values();
  test_missing_key_placeholder_by_default();
  test_missing_key_can_throw();
  test_enterprise_terms_remain_uppercase();
}
