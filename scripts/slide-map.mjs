import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG_FILE = path.join(ROOT, "docs", "slides", "SLIDES_CATALOG.json");
const OUT = path.join(ROOT, ".run", "slide-map.json");

const LOW = "LOW";
const MEDIUM = "MEDIUM";
const HIGH = "HIGH";

function count(pattern, text) {
  return (text.match(pattern) || []).length;
}

function bucketComplexity(loc, hooks, listeners, timers, inlineStyles) {
  const score = loc + hooks * 25 + listeners * 50 + timers * 40 + inlineStyles * 5;
  if (score >= 1300) return HIGH;
  if (score >= 380) return MEDIUM;
  return LOW;
}

function bucketVisual(inlineStyles, styleBlocks, hasWidgetImport, hasManyDivs) {
  const score = inlineStyles * 2 + styleBlocks * 8 + (hasWidgetImport ? 10 : 0) + (hasManyDivs ? 6 : 0);
  if (score >= 28) return HIGH;
  if (score >= 12) return MEDIUM;
  return LOW;
}

function narrativeFromHeader(src) {
  const m = src.match(/<Header\s+title="([^"]+)"(?:\s+breadcrumb="([^"]+)")?/);
  if (m) {
    const title = m[1];
    const crumb = m[2] ? ` (${m[2]})` : "";
    return `${title}${crumb}`;
  }
  return "Custom visual section (no standard header title found)";
}

async function parseRegistry() {
  const src = await fs.readFile(CATALOG_FILE, "utf8");
  const catalog = JSON.parse(src);
  if (!Array.isArray(catalog.mainRoute)) {
    throw new Error("mainRoute[] is required in docs/slides/SLIDES_CATALOG.json");
  }
  return catalog.mainRoute.map((entry) => ({
    index: entry.index,
    routeId: entry.routeId,
    slideId: entry.slideId,
    component: entry.componentName,
    file: entry.componentFile,
    classification: entry.classification,
    determinism: entry.determinism,
  }));
}

async function analyzeSlide(s) {
  const full = path.join(ROOT, s.file);
  const src = await fs.readFile(full, "utf8");
  const loc = src.split(/\r?\n/).length;

  const hooks =
    count(/\buseState\s*\(/g, src) +
    count(/\buseEffect\s*\(/g, src) +
    count(/\buseMemo\s*\(/g, src) +
    count(/\buseRef\s*\(/g, src) +
    count(/\buseLayoutEffect\s*\(/g, src) +
    count(/\buseCallback\s*\(/g, src);
  const listeners = count(/addEventListener\s*\(/g, src);
  const timers =
    count(/\bsetTimeout\s*\(/g, src) +
    count(/\bsetInterval\s*\(/g, src) +
    count(/\brequestAnimationFrame\s*\(/g, src);
  const raf = count(/\brequestAnimationFrame\s*\(/g, src);
  const inlineStyles = count(/style=\{\{/g, src);
  const styleBlocks = count(/<style>/g, src);

  const imports = [...src.matchAll(/import\s+(.+?)\s+from\s+["'](.+?)["'];/g)]
    .map((m) => ({ raw: m[1], source: m[2] }))
    .filter((m) => !m.source.includes("react") && !m.source.includes("SlideRenderer"));

  const childImports = imports.map((i) => i.source);
  const childJsx = [...new Set([...src.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)].map((m) => m[1]))]
    .filter((n) => !["SlideContainer", "Header", "NavArea", "DataBox", "LensWrapper"].includes(n));

  const keySignals = {
    hooks,
    animations: count(/animate-|@keyframes|transition-|motion|framer/gi, src),
    timers,
    raf,
    eventListeners: listeners,
    aiInteraction: /AIChat|\/api\/ai|model/i.test(src),
    backgroundEffects: /radial-gradient|noise|scan|glow|vignette|backdrop-blur/i.test(src),
  };

  return {
    ...s,
    loc,
    purpose: narrativeFromHeader(src),
    childImports,
    childJsx,
    keySignals,
    visualDensity: bucketVisual(inlineStyles, styleBlocks, childImports.length > 0, loc > 400),
    codeComplexity: bucketComplexity(loc, hooks, listeners, timers, inlineStyles),
  };
}

async function main() {
  const slides = await parseRegistry();
  const out = [];
  for (const s of slides) out.push(await analyzeSlide(s));
  await fs.mkdir(path.join(ROOT, ".run"), { recursive: true });
  await fs.writeFile(
    OUT,
    `${JSON.stringify({ schemaVersion: "slide-map.v2", source: "docs/slides/SLIDES_CATALOG.json", slides: out }, null, 2)}\n`
  );
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
