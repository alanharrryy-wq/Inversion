import { runNoReworkGuardSpecs } from './no-rework-guard.unit';
import { runPlaywrightHarnessSpecs } from './playwright-harness.unit';
import { runBootEvidenceSpecs } from './boot-evidence.unit';
import { runBootReducerSpecs } from './boot-reducer.unit';
import { runBootWowGateSpecs } from './boot-wow-gate.unit';
import { runGuideEngineSpecs } from './wow-guide-engine.unit';
import { runGuideSchemaSpecs } from './wow-guide-schema.unit';
import { runSlide00CopySpecs } from './slide00-copy.unit';
import { runSlideRegistrySchemaSpecs } from './slide-registry-schema.unit';
import { runSlideRegistryNormalizeSpecs } from './slide-registry-normalize.unit';
import { runSlideRegistryAdapterSpecs } from './slide-registry-adapter.unit';
import { runFirstProofHelperSpecs } from '../../components/slides/slide00-ui/first-proof/__tests__/firstProof.helpers.test';

runBootReducerSpecs();
runBootEvidenceSpecs();
runBootWowGateSpecs();
runGuideEngineSpecs();
runGuideSchemaSpecs();
runSlide00CopySpecs();
runSlideRegistrySchemaSpecs();
runSlideRegistryNormalizeSpecs();
runSlideRegistryAdapterSpecs();
runFirstProofHelperSpecs();
runPlaywrightHarnessSpecs();
runNoReworkGuardSpecs();

console.log('[unit] PASS');
