import de_DE from "./de_DE.json";
import it_IT from "./it_IT.json";
import fr_FR from "./fr_FR.json";
import es_ES from "./es_ES.json";

export const locales = {
  "en-US": "English", // default
  "de-DE": "Deutsch",
  "it-IT": "Italiano",
  "fr-FR": "Français",
  "es-ES": "Español",
} as const;

export type Locale = keyof typeof locales;
export type NonDefaultLocale = Exclude<Locale, "en-US">;

export function isKnownLocale(l: string): l is Locale {
  return l in locales;
}

export const data: Record<NonDefaultLocale, Record<string, string>> = {
  "de-DE": de_DE,
  "it-IT": it_IT,
  "fr-FR": fr_FR,
  "es-ES": es_ES,
};
