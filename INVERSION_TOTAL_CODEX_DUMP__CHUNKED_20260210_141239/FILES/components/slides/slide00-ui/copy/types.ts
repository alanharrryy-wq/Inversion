
export type CopyLocale = 'es';

export type CopyPrimitive = string | number | boolean | null | undefined;

export type CopyParams = Record<string, CopyPrimitive>;

export type MissingCopyBehavior = 'placeholder' | 'empty' | 'throw';

export type CopyDictionary = Record<string, string>;

export type CopyResolverOptions = {
  locale?: CopyLocale;
  fallbackLocale?: CopyLocale;
  missingBehavior?: MissingCopyBehavior;
  onMissing?: (args: { key: string; locale: CopyLocale }) => void;
};

export type CopyResolverInput = {
  dictionaries: Partial<Record<CopyLocale, CopyDictionary>>;
  options?: CopyResolverOptions;
};

export type CopyResolver = {
  locale: CopyLocale;
  t: (key: string, params?: CopyParams) => string;
  has: (key: string) => boolean;
  dictionary: CopyDictionary;
  enterpriseTerms: readonly string[];
};

export type InterpolationToken = {
  key: string;
  value: string;
};

export type InterpolationResult = {
  text: string;
  tokens: InterpolationToken[];
};

export type CopyBoundaryValue = CopyResolver;

