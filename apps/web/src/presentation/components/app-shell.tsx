import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";
import { type Locale } from "@/presentation/i18n/messages.ts";
import { useLocale, useT } from "@/presentation/i18n/use-t.ts";
import { cn } from "@/lib/utils.ts";
import { useSession } from "@/presentation/session.tsx";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <Link href="/" className="group flex items-center gap-3 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
          <Logo />
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-tight">unmix</div>
            <div className="hidden text-xs text-muted-foreground sm:block">{t("app.tagline")}</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <AccountMenu />
        </div>
      </header>
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}

function AccountMenu() {
  const { state, signOut } = useSession();
  const t = useT();
  if (state.status !== "signed-in") return null;
  const { name, email, imageUrl } = state.user;
  return (
    <div className="flex items-center gap-1">
      <span title={`${name} · ${email}`} className="flex size-8 items-center justify-center overflow-hidden rounded-full border bg-secondary text-xs font-medium uppercase">
        {imageUrl ? <img src={imageUrl} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : name.slice(0, 1)}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        title={t("auth.signOut")}
        aria-label={t("auth.signOut")}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <div role="group" aria-label={t("app.language")} className="flex rounded-full border p-0.5 text-xs">
      {(["es", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => {
            setLocale(l);
            document.documentElement.lang = l;
          }}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === l ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Logo() {
  const bars = [
    ["--stem-vocals", 10],
    ["--stem-drums", 18],
    ["--stem-bass", 12],
    ["--stem-guitar", 6],
  ] as const;
  return (
    <div aria-hidden className="flex size-9 items-center justify-center gap-[3px] rounded-lg border bg-card">
      {bars.map(([color, h]) => (
        <span key={color} className="w-[3px] rounded-full transition-[height] group-hover:h-5" style={{ height: h, background: `var(${color})` }} />
      ))}
    </div>
  );
}
