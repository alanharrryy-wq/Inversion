import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SLIDE_RENDERER = path.join(ROOT, "components", "SlideRenderer.tsx");
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
  const src = await fs.readFile(SLIDE_RENDERER, "utf8");
  const imports = [...src.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+"\.\/slides\/([^"]+)";/g)]
    .map((m) => ({ name: m[1], rel: m[2] }));
  const map = new Map(imports.map((i) => [i.name, i.rel]));
  const block = src.match(/const SLIDES:[\s\S]*?=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error("SLIDES array not found");
  const comps = block[1]
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/g, "").trim().replace(/,$/, ""))
    .filter(Boolean);
  return comps.map((comp, index) => ({
    index,
    component: comp,
    file: `components/slides/${map.get(comp)}.tsx`,
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
  await fs.writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), slides: out }, null, 2));
  console.log(`Wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
