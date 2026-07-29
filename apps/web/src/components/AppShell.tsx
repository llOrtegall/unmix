import type { ReactNode } from "react";
import { Link } from "wouter";
import { useT } from "@/i18n/useT.ts";
import { AccountMenu } from "./AccountMenu.tsx";
import { LanguageSwitch } from "./LanguageSwitch.tsx";
import { Logo } from "./Logo.tsx";

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
