
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const auditScript = path.join(repoRoot, "scripts", "gemini-audit.ps1");
const powershellExe = process.env.ComSpec && process.platform === "win32" ? "powershell" : "powershell";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalize(input) {
  return input.replace(/\\/g, "/");
}

function runAudit(caseRoot, strict) {
  const args = [
    "-NoLogo",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    auditScript,
    "-RepoRoot",
    caseRoot,
    "-OutFile",
    "GEMINI_EXPOSURE_AUDIT.md",
  ];
  if (strict) {
    args.push("-Strict");
  }

  const result = spawnSync(powershellExe, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  const reportPath = path.join(caseRoot, "GEMINI_EXPOSURE_AUDIT.md");
  const report = existsSync(reportPath) ? readFileSync(reportPath, "utf8") : "";

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    reportPath,
    report,
  };
}

function writeCaseFile(root, relPath, content) {
  const full = path.join(root, relPath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
}

function createBaseFixture(root) {
  writeCaseFile(
    root,
    "components/AIChat.tsx",
    [
      "export async function sendMessage(message: string) {",
      "  return fetch('/api/ai', {",
      "    method: 'POST',",
      "    headers: { 'content-type': 'application/json' },",
      "    body: JSON.stringify({ mode: 'chat', message }),",
      "  });",
      "}",
      "",
    ].join("\n")
  );

  writeCaseFile(
    root,
    "server/index.ts",
    [
      'import { GoogleGenAI } from "@google/genai";',
      "const key = process.env.AI_BACKEND_API_KEY;",
      "export const configured = Boolean(key);",
      "export const sdk = configured ? new GoogleGenAI({ apiKey: key! }) : null;",
      "",
    ].join("\n")
  );

  writeCaseFile(
    root,
    "index.html",
    [
      "<!doctype html>",
      "<html>",
      "<head>",
      "  <meta charset='utf-8' />",
      "</head>",
      "<body>",
      "  <div id='root'></div>",
      "</body>",
      "</html>",
      "",
    ].join("\n")
  );

  writeCaseFile(
    root,
    "README.md",
    [
      "# Fixture",
      "",
      "This fixture is used only for local audit verification.",
      "",
    ].join("\n")
  );
}

function withFixture(name, setupFn) {
  const tmpBase = mkdtempSync(path.join(os.tmpdir(), "inversion-gemini-audit-"));
  const caseRoot = path.join(tmpBase, name);
  mkdirSync(caseRoot, { recursive: true });
  createBaseFixture(caseRoot);
  setupFn(caseRoot);
  return {
    caseRoot,
    cleanup() {
      rmSync(tmpBase, { recursive: true, force: true });
    },
  };
}

function runCase(name, expectedStrictExit, setupFn, validatorFn) {
  const fixture = withFixture(name, setupFn);
  try {
    const strictResult = runAudit(fixture.caseRoot, true);
    const looseResult = runAudit(fixture.caseRoot, false);

    console.log(`[gemini:audit:fixture] case=${name} strict_exit=${strictResult.status} expected=${expectedStrictExit}`);
    if (strictResult.status !== expectedStrictExit) {
      console.error("[gemini:audit:fixture] strict stdout:");
      console.error(strictResult.stdout);
      console.error("[gemini:audit:fixture] strict stderr:");
      console.error(strictResult.stderr);
      throw new Error(`Case ${name}: expected strict exit ${expectedStrictExit}, got ${strictResult.status}`);
    }

    if (looseResult.status !== 0) {
      console.error("[gemini:audit:fixture] non-strict stdout:");
      console.error(looseResult.stdout);
      console.error("[gemini:audit:fixture] non-strict stderr:");
      console.error(looseResult.stderr);
      throw new Error(`Case ${name}: non-strict mode must always exit 0, got ${looseResult.status}`);
    }

    assert(existsSync(strictResult.reportPath), `Case ${name}: report file was not generated`);
    assert(strictResult.report.includes("## Findings"), `Case ${name}: report missing findings section`);
    validatorFn(strictResult, looseResult);
  } finally {
    fixture.cleanup();
  }
}

function validateFailCase(result, expectedRule) {
  assert(
    result.report.includes("CLIENT_P0"),
    `Fail case should contain CLIENT_P0 findings. Report: ${normalize(result.reportPath)}`
  );
  assert(
    result.report.includes(expectedRule),
    `Fail case should include rule ${expectedRule}. Report: ${normalize(result.reportPath)}`
  );
}

function validatePassCase(result) {
  const summaryLine = result.report.split(/\r?\n/u).find((line) => line.includes("CLIENT_P0 (strict gate)"));
  assert(Boolean(summaryLine), "Pass case missing CLIENT_P0 summary line");
  assert(/0\s*\|?$/.test(summaryLine || ""), `Pass case expected zero CLIENT_P0 findings, got: ${summaryLine}`);
}

function main() {
  assert(existsSync(auditScript), `Audit script not found: ${normalize(auditScript)}`);

  runCase(
    "pass-server-only",
    0,
    () => {},
    (strictResult) => {
      validatePassCase(strictResult);
      assert(
        strictResult.report.includes("SERVER_PROVIDER_IMPORT"),
        "Server-only usage should be visible as INFO context"
      );
    }
  );

  runCase(
    "fail-client-import",
    2,
    (root) => {
      writeCaseFile(
        root,
        "components/Leak.tsx",
        [
          'import { GoogleGenAI } from "@google/genai";',
          "export const value = GoogleGenAI ? 'ok' : 'nope';",
          "",
        ].join("\n")
      );
    },
    (strictResult) => {
      validateFailCase(strictResult, "CLIENT_IMPORT_GOOGLE_GENAI");
    }
  );

  runCase(
    "fail-client-route",
    2,
    (root) => {
      writeCaseFile(
        root,
        "components/LeakRoute.tsx",
        [
          "export const post = () => fetch('/api/gemini', { method: 'POST' });",
          "",
        ].join("\n")
      );
    },
    (strictResult) => {
      validateFailCase(strictResult, "CLIENT_LEGACY_ROUTE");
    }
  );

  runCase(
    "fail-client-index-importmap",
    2,
    (root) => {
      writeCaseFile(
        root,
        "index.html",
        [
          "<!doctype html>",
          "<html>",
          "<head>",
          "  <script type='importmap'>",
          "  {",
          '    "imports": { "@google/genai": "https://example.invalid/genai.js" }',
          "  }",
          "  </script>",
          "</head>",
          "<body><div id='root'></div></body>",
          "</html>",
          "",
        ].join("\n")
      );
    },
    (strictResult) => {
      validateFailCase(strictResult, "CLIENT_IMPORT_GOOGLE_GENAI");
    }
  );

  runCase(
    "pass-docs-only",
    0,
    (root) => {
      writeCaseFile(
        root,
        "README.md",
        [
          "# Notes",
          "",
          "Historical note: legacy endpoint `/api/gemini` existed in older revisions.",
          "Historical note: provider SDK mention `@google/genai` for server migration logs.",
          "",
        ].join("\n")
      );
    },
    (strictResult) => {
      validatePassCase(strictResult);
      assert(
        strictResult.report.includes("DOC_OR_TOOLING_MENTION"),
        "Docs mention should be reported as INFO only."
      );
    }
  );

  console.log("[gemini:audit:fixture] PASS");
}

main();

