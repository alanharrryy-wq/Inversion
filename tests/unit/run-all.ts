import { runNoReworkGuardSpecs } from './no-rework-guard.unit';
import { runPlaywrightHarnessSpecs } from './playwright-harness.unit';
import { runGuideEngineSpecs } from './wow-guide-engine.unit';
import { runGuideSchemaSpecs } from './wow-guide-schema.unit';

runGuideEngineSpecs();
runGuideSchemaSpecs();
runPlaywrightHarnessSpecs();
runNoReworkGuardSpecs();

console.log('[unit] PASS');
