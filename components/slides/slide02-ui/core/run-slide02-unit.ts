import { runSlide02ModelSpecs } from "./model.spec";
import { runSlide02FsmSpecs } from "./fsm.spec";
import { runSlide02ReplaySpecs } from "./replay.spec";
import { runSlide02ContextSpecs } from "./context.spec";
import { assertAllPass, printSuiteResult } from "./test-utils";

const results = [
  runSlide02ModelSpecs(),
  runSlide02FsmSpecs(),
  runSlide02ReplaySpecs(),
  runSlide02ContextSpecs(),
];

results.forEach((result) => printSuiteResult(result));
assertAllPass(results);

console.log("[slide02-unit] PASS");
