import type { Locale } from "@/i18n/messages.ts";
import { useLocale, useT } from "@/i18n/useT.ts";
import { cn } from "@/lib/utils.ts";

const LOCALES: readonly Locale[] = ["es", "en"];

export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <div role="group" aria-label={t("app.language")} className="flex rounded-full border p-0.5 text-xs">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => {
            setLocale(option);
            document.documentElement.lang = option;
          }}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === option ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
