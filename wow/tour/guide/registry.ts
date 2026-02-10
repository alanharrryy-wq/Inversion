import { assertGuideScripts } from './schema';
import { enterpriseGuideScript, guidedDemoScript } from './scripts';
import { GuideScript, GuideScriptCatalog } from './types';

const GUIDE_SCRIPTS: GuideScript[] = assertGuideScripts([
  enterpriseGuideScript,
  guidedDemoScript,
]);

const GUIDE_SCRIPT_CATALOG: GuideScriptCatalog = GUIDE_SCRIPTS.reduce<GuideScriptCatalog>((acc, script) => {
  acc[script.id] = script;
  return acc;
}, {});

export function listGuideScripts(): GuideScript[] {
  return GUIDE_SCRIPTS;
}

export function hasGuideScript(scriptId: string | undefined): boolean {
  if (!scriptId) return false;
  return Boolean(GUIDE_SCRIPT_CATALOG[scriptId]);
}

export function resolveGuideScript(scriptId?: string): GuideScript {
  if (scriptId && GUIDE_SCRIPT_CATALOG[scriptId]) {
    return GUIDE_SCRIPT_CATALOG[scriptId];
  }
  return enterpriseGuideScript;
}

export function getGuideScriptCatalog(): GuideScriptCatalog {
  return { ...GUIDE_SCRIPT_CATALOG };
}

export const DEFAULT_GUIDE_SCRIPT_ID = enterpriseGuideScript.id;
