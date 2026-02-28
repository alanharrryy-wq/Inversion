import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CATALOG_FILE = path.join(ROOT, "docs", "slides", "SLIDES_CATALOG.json");
const RUN_DIR = path.join(ROOT, ".run");
const OUTPUT = path.join(RUN_DIR, "slide-intel.json");

function count(pattern, text) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function scoreComplexity(m) {
  let score = 0;
  score += Math.min(3, m.loc / 500);
  score += Math.min(2, m.hooks * 0.2);
  score += Math.min(1.5, m.eventListeners * 0.5);
  score += Math.min(1.5, m.timers * 0.4);
  score += Math.min(1, m.inlineStyles > 10 ? 1 : m.inlineStyles / 10);
  score += Math.min(1, m.embeddedStyleBlocks > 0 ? 1 : 0);
  return Number(Math.min(10, score).toFixed(1));
}

function buildRisks(m) {
  const risks = [];
  if (m.eventListeners >= 3) risks.push("Multiple event listeners");
  if (m.raf > 0) risks.push("requestAnimationFrame loop");
  if (m.timers >= 3) risks.push("Many timers");
  if (m.hooks >= 10) risks.push("High hook/state density");
  if (m.inlineStyles >= 10) risks.push("Many inline style objects");
  if (m.embeddedStyleBlocks > 0) risks.push("Embedded <style> blocks");
  return risks;
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

async function analyzeSlide(entry) {
  const full = path.join(ROOT, entry.file);
  const src = await fs.readFile(full, "utf8");
  const lines = src.split(/\r?\n/);
  const loc = lines.length;
  const hooks =
    count(/\buseState\s*\(/g, src) +
    count(/\buseEffect\s*\(/g, src) +
    count(/\buseMemo\s*\(/g, src) +
    count(/\buseRef\s*\(/g, src);
  const eventListeners = count(/addEventListener\s*\(/g, src);
  const timers =
    count(/\bsetTimeout\s*\(/g, src) +
    count(/\bsetInterval\s*\(/g, src) +
    count(/\brequestAnimationFrame\s*\(/g, src);
  const inlineStyles = count(/style=\{\{/g, src);
  const embeddedStyleBlocks = count(/<style>/g, src);
  const headings = [...src.matchAll(/<Header\s+title="([^"]+)"(?:\s+breadcrumb="([^"]+)")?/g)].map((m) => ({
    title: m[1],
    breadcrumb: m[2] ?? "",
  }));

  const metrics = {
    loc,
    hooks,
    eventListeners,
    timers,
    raf: count(/\brequestAnimationFrame\s*\(/g, src),
    intervals: count(/\bsetInterval\s*\(/g, src),
    timeouts: count(/\bsetTimeout\s*\(/g, src),
    inlineStyles,
    embeddedStyleBlocks,
    onClickHandlers: count(/onClick=/g, src),
    onHoverHandlers: count(/onMouseEnter=|onMouseLeave=/g, src),
    keydownHandlers: count(/keydown/g, src),
    usesReducedMotion: /\(prefers-reduced-motion/.test(src),
  };

  return {
    ...entry,
    headings,
    metrics,
    complexityScore: scoreComplexity(metrics),
    risks: buildRisks(metrics),
  };
}

async function main() {
  const registry = await parseRegistry();
  const slides = [];
  for (const entry of registry) {
    slides.push(await analyzeSlide(entry));
  }

  const topComplex = [...slides]
    .sort((a, b) => b.complexityScore - a.complexityScore)
    .slice(0, 5)
    .map((s) => ({
      index: s.index,
      component: s.component,
      file: s.file,
      complexityScore: s.complexityScore,
    }));

  const payload = {
    schemaVersion: "slide-intel.v2",
    slideCount: slides.length,
    registrySource: "docs/slides/SLIDES_CATALOG.json",
    slides,
    topComplex,
  };

  await fs.mkdir(RUN_DIR, { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
