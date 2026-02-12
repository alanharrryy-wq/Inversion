import { runSlide04SummaryModelSpecs } from "./summary-model.unit";
import { runSlide04ReducerSpecs } from "./reducer-fsm.unit";
import { runSlide04ReplaySpecs } from "./replay.unit";

runSlide04SummaryModelSpecs();
runSlide04ReducerSpecs();
runSlide04ReplaySpecs();

console.log("[slide04-unit] PASS");
