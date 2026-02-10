
import React, { createContext, useContext, useMemo } from 'react';
import { esCopy } from './es';
import { createCopyResolver } from './getCopy';
import { CopyBoundaryValue, CopyLocale, CopyResolverOptions } from './types';

type CopyBoundaryProps = {
  locale?: CopyLocale;
  options?: Omit<CopyResolverOptions, 'locale'>;
  children: React.ReactNode;
};

const CopyContext = createContext<CopyBoundaryValue | null>(null);

export function CopyBoundary(props: CopyBoundaryProps) {
  const locale = props.locale ?? 'es';

  const resolver = useMemo(
    () =>
      createCopyResolver({
        dictionaries: { es: esCopy },
        options: {
          locale,
          fallbackLocale: props.options?.fallbackLocale ?? 'es',
          missingBehavior: props.options?.missingBehavior ?? 'placeholder',
          onMissing: props.options?.onMissing,
        },
      }),
    [locale, props.options?.fallbackLocale, props.options?.missingBehavior, props.options?.onMissing]
  );

  return <CopyContext.Provider value={resolver}>{props.children}</CopyContext.Provider>;
}

export function useCopy(): CopyBoundaryValue {
  const value = useContext(CopyContext);

  if (!value) {
    throw new Error('useCopy must be used inside CopyBoundary.');
  }

  return value;
}

