import { runDeterminismScriptSpecs } from "./determinism-scenarios.unit";
import { runEvidenceModelSpecs } from "./evidence-model.unit";
import { runFsmReducerSpecs } from "./fsm-reducer.unit";
import { runReplaySpecs } from "./replay.unit";

runEvidenceModelSpecs();
runFsmReducerSpecs();
runReplaySpecs();
runDeterminismScriptSpecs();

console.log("[slide03-unit] PASS");
