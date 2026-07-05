import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_UPLOAD_MB } from "@/domain/upload-policy.ts";
import { type Locale, MESSAGES, type MessageKey } from "./messages.ts";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const browserLocale: Locale = typeof navigator !== "undefined" && navigator.language.startsWith("es") ? "es" : "en";

export const useLocale = create<LocaleState>()(
  persist((set) => ({ locale: browserLocale, setLocale: (locale) => set({ locale }) }), { name: "unmix.locale" }),
);

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function useT(): Translate {
  const locale = useLocale((s) => s.locale);
  return useCallback(
    (key, vars) => MESSAGES[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars?.[name] ?? `{${name}}`)),
    [locale],
  );
}

/** Friendly message for an error code coming from the API or the upload policy. */
export function errorMessage(t: Translate, code: string): string {
  const key = `error.${code}` as MessageKey;
  return key in MESSAGES.es ? t(key, { mb: MAX_UPLOAD_MB }) : t("error.generic");
}
