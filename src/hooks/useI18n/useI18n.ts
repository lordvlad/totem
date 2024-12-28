import { useCallback } from "react";
import { data, type Locale, type NonDefaultLocale } from "./locales";
import { useLocale } from "./useLocale";

function getLocalizedLiterals(
  locale: Locale,
  literals: string[] | TemplateStringsArray,
) {
  const key = literals.join("{}");
  const localized = Array.from(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- should be ok
    locale in data && key in data[locale as NonDefaultLocale]
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- should be ok
        data[locale as NonDefaultLocale][key].split(/\{\}/)
      : literals,
  );
  return localized;
}

export function useI18n() {
  const locale = useLocale();
  return useCallback(
    (literals: TemplateStringsArray, ...placeholders: unknown[]) =>
      getLocalizedLiterals(locale, literals)
        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-plus-operands -- thats okay, thats the default template string behavior
        .map((s, i) => s + (placeholders[i] ?? ""))
        .join(""),
    [locale],
  );
}
