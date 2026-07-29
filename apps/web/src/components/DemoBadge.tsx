import { useT } from "@/i18n/useT.ts";

export function DemoBadge() {
  const t = useT();
  return (
    <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium tracking-normal text-primary">
      {t("demo.badge")}
    </span>
  );
}
