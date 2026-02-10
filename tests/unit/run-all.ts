import { runNoReworkGuardSpecs } from './no-rework-guard.unit';
import { runPlaywrightHarnessSpecs } from './playwright-harness.unit';
import { runBootEvidenceSpecs } from './boot-evidence.unit';
import { runBootReducerSpecs } from './boot-reducer.unit';
import { runBootWowGateSpecs } from './boot-wow-gate.unit';
import { runGuideEngineSpecs } from './wow-guide-engine.unit';
import { runGuideSchemaSpecs } from './wow-guide-schema.unit';

runBootReducerSpecs();
runBootEvidenceSpecs();
runBootWowGateSpecs();
runGuideEngineSpecs();
runGuideSchemaSpecs();
runPlaywrightHarnessSpecs();
runNoReworkGuardSpecs();

console.log('[unit] PASS');
