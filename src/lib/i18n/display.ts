import { translate, type Language, type TranslationValues } from "./translate";

/** Server output defaults to Indonesian; browser formatters follow the UI setting. */
export function getDisplayLanguage(): Language {
  return typeof document !== "undefined" &&
    document.documentElement.lang === "en"
    ? "en"
    : "id";
}
export function getDisplayLocale() {
  return getDisplayLanguage() === "en" ? "en-GB" : "id-ID";
}
export function translateDisplay(source: string, values?: TranslationValues) {
  return translate(source, getDisplayLanguage(), values);
}
