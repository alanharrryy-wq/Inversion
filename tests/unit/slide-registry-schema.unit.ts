import { strict as assert } from 'node:assert';
import {
  SLIDE_SCHEMA,
  SlideSchemaEntry,
  buildLookup,
  validateSchema,
} from '../../runtime/slides/contracts';

function cloneSchema(schema: SlideSchemaEntry[]): SlideSchemaEntry[] {
  return schema.map((entry) => ({
    ...entry,
    aliases: [...entry.aliases],
    fileCandidates: [...entry.fileCandidates],
  }));
}

function expectValidationFailure(schema: SlideSchemaEntry[], messageIncludes: string): void {
  let error: unknown = null;
  try {
    validateSchema(schema);
  } catch (caught) {
    error = caught;
  }

  assert.ok(error instanceof Error, 'Expected validation to throw Error');
  assert.ok(error.message.includes(messageIncludes), `Expected error to include: ${messageIncludes}`);
}

function test_valid_schema_passes(): void {
  const validated = validateSchema(cloneSchema(SLIDE_SCHEMA));
  assert.equal(validated.length, 20);
  assert.equal(validated[0].slot, 0);
  assert.equal(validated[19].slot, 19);

  const lookup = buildLookup(validated);
  assert.equal(lookup.bySlot.size, 20);
  assert.equal(lookup.byRouteId.size, 20);
}

function test_duplicate_slot_fails(): void {
  const schema = cloneSchema(SLIDE_SCHEMA);
  schema[1] = {
    ...schema[1],
    slot: schema[0].slot,
    routeId: schema[0].routeId,
  };

  expectValidationFailure(schema, 'Duplicate slot: 0');
}

function test_missing_slot_fails_with_explicit_list(): void {
  const schema = cloneSchema(SLIDE_SCHEMA).filter((entry) => entry.slot !== 3);
  expectValidationFailure(schema, 'Missing slots: 03');
}

function test_duplicate_route_id_fails(): void {
  const schema = cloneSchema(SLIDE_SCHEMA);
  schema[4] = {
    ...schema[4],
    routeId: schema[3].routeId,
  };

  expectValidationFailure(schema, 'Duplicate routeId: 03');
}

function test_alias_collision_fails(): void {
  const schema = cloneSchema(SLIDE_SCHEMA);
  schema[2].aliases.push('Slide7');
  expectValidationFailure(schema, 'Duplicate alias "Slide7"');
}

export function runSlideRegistrySchemaSpecs(): void {
  test_valid_schema_passes();
  test_duplicate_slot_fails();
  test_missing_slot_fails_with_explicit_list();
  test_duplicate_route_id_fails();
  test_alias_collision_fails();
}

