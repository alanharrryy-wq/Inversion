import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = process.cwd();
const SCHEMA_OUT = path.join(".run", "slide-schema-export.json");
const REPORT_JSON_OUT = path.join("docs", "_generated", "SLIDE_REGISTRY_REPORT.json");
const REPORT_MD_OUT = path.join("docs", "_generated", "SLIDE_REGISTRY_REPORT.md");

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${String(result.status ?? "null")}`);
  }
}

function canRun(command, args) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    stdio: "ignore",
    shell: false,
  });
  return result.status === 0;
}

function resolveTsx() {
  if (process.platform === "win32" && canRun("tsx.cmd", ["--version"])) {
    return { command: "tsx.cmd", prefix: [] };
  }
  if (canRun("tsx", ["--version"])) {
    return { command: "tsx", prefix: [] };
  }

  const localCli = path.join(REPO_ROOT, "node_modules", "tsx", "dist", "cli.mjs");
  if (existsSync(localCli)) {
    return { command: process.execPath, prefix: [localCli] };
  }

  throw new Error("tsx executable not found. Expected `tsx` or local node_modules/tsx.");
}

function resolvePython() {
  if (canRun("python", ["--version"])) {
    return { command: "python", prefix: [] };
  }
  if (canRun("py", ["-3", "--version"])) {
    return { command: "py", prefix: ["-3"] };
  }
  throw new Error("Python executable not found. Expected `python` or `py -3`.");
}

function main() {
  console.log("[verify:slides] exporting schema");
  const tsx = resolveTsx();
  run(
    tsx.command,
    [...tsx.prefix, "scripts/export-slide-schema.ts", "--out", SCHEMA_OUT],
    "slide schema export"
  );

  console.log("[verify:slides] running drift detector");
  const python = resolvePython();
  run(
    python.command,
    [
      ...python.prefix,
      "tools/analysis/check_slide_registry.py",
      "--schema-json",
      SCHEMA_OUT,
      "--json-out",
      REPORT_JSON_OUT,
      "--md-out",
      REPORT_MD_OUT,
    ],
    "slide registry drift check"
  );

  console.log("[verify:slides] PASS");
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[verify:slides] FAIL ${message}`);
  process.exitCode = 1;
}
