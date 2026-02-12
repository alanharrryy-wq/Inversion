
import { ENTERPRISE_TERM_ALLOWLIST, esCopy } from './es';
import {
  CopyDictionary,
  CopyLocale,
  CopyParams,
  CopyResolver,
  CopyResolverInput,
  CopyResolverOptions,
  InterpolationResult,
  MissingCopyBehavior,
} from './types';

const DEFAULT_LOCALE: CopyLocale = 'es';

function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

function compileInterpolation(template: string, params?: CopyParams): InterpolationResult {
  const tokens: InterpolationResult['tokens'] = [];

  const text = template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const raw = params?.[key];
    const value = safeString(raw);
    tokens.push({ key, value });
    return value;
  });

  return { text, tokens };
}

function enterpriseTermPass(text: string, terms: readonly string[]): string {
  let output = text;

  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
    output = output.replace(pattern, term);
  }

  return output;
}

function missingValue(key: string, behavior: MissingCopyBehavior): string {
  if (behavior === 'empty') return '';
  if (behavior === 'throw') {
    throw new Error(`Missing copy key: ${key}`);
  }
  return `[missing-copy:${key}]`;
}

function resolveLocaleDictionary(
  dictionaries: Partial<Record<CopyLocale, CopyDictionary>>,
  locale: CopyLocale,
  fallbackLocale: CopyLocale
): CopyDictionary {
  const direct = dictionaries[locale];
  if (direct) return direct;
  const fallback = dictionaries[fallbackLocale];
  if (fallback) return fallback;
  return esCopy;
}

function resolveOptions(options?: CopyResolverOptions): Required<CopyResolverOptions> {
  return {
    locale: options?.locale ?? DEFAULT_LOCALE,
    fallbackLocale: options?.fallbackLocale ?? DEFAULT_LOCALE,
    missingBehavior: options?.missingBehavior ?? 'placeholder',
    onMissing: options?.onMissing ?? (() => undefined),
  };
}

export function createCopyResolver(input: CopyResolverInput): CopyResolver {
  const options = resolveOptions(input.options);
  const dictionary = resolveLocaleDictionary(input.dictionaries, options.locale, options.fallbackLocale);

  const has = (key: string): boolean => Object.prototype.hasOwnProperty.call(dictionary, key);

  const t = (key: string, params?: CopyParams): string => {
    const template = dictionary[key];

    if (typeof template !== 'string') {
      options.onMissing({ key, locale: options.locale });
      return missingValue(key, options.missingBehavior);
    }

    const interpolation = compileInterpolation(template, params);
    return enterpriseTermPass(interpolation.text, ENTERPRISE_TERM_ALLOWLIST);
  };

  return {
    locale: options.locale,
    t,
    has,
    dictionary,
    enterpriseTerms: ENTERPRISE_TERM_ALLOWLIST,
  };
}

export function getCopy(key: string, params?: CopyParams): string {
  const resolver = createCopyResolver({
    dictionaries: { es: esCopy },
    options: { locale: 'es', fallbackLocale: 'es', missingBehavior: 'placeholder' },
  });

  return resolver.t(key, params);
}

export function hasCopyKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(esCopy, key);
}

export function listEnterpriseTerms(): readonly string[] {
  return ENTERPRISE_TERM_ALLOWLIST;
}

