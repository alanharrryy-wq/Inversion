import { runSlide01ReducerSpecs } from "./fsm/slide01-reducer.unit";
import { runSlide01ScoringSpecs } from "./fsm/slide01-scoring.unit";
import { runSlide01ReplaySpecs } from "./replay/slide01-replay.unit";

runSlide01ReducerSpecs();
runSlide01ScoringSpecs();
runSlide01ReplaySpecs();

console.log("[slide01-unit] PASS");
