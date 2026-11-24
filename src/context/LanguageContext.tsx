"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translate,
  type Language,
  type TranslationValues,
} from "@/lib/i18n/translate";

type LanguageContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (source: string | number, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "id" as Language,
  locale: "id-ID",
  setLanguage: () => {},
  t: (source: string | number, values?: TranslationValues) =>
    translate(String(source), "id", values),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>("id");
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("livon-language");
    } catch {}
    const next = saved === "en" ? "en" : "id";
    document.documentElement.lang = next;
    const timer = window.setTimeout(() => setCurrentLanguage(next), 0);
    const sync = (event: StorageEvent) => {
      if (event.key === "livon-language") {
        const next = event.newValue === "en" ? "en" : "id";
        document.documentElement.lang = next;
        setCurrentLanguage(next);
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const setLanguage = useCallback((next: Language) => {
    document.documentElement.lang = next;
    setCurrentLanguage(next);
    try {
      localStorage.setItem("livon-language", next);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const t = useCallback(
    (source: string | number, values?: TranslationValues) =>
      translate(String(source), language, values),
    [language],
  );
  const value = useMemo(
    () => ({
      language,
      locale: language === "en" ? "en-GB" : "id-ID",
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function UiText({ children }: { children: string }) {
  const { t } = useLanguage();
  return t(children);
}
