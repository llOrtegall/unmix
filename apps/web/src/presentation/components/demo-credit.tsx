import { useT } from "@/presentation/i18n/use-t.ts";

export function DemoBadge() {
  const t = useT();
  return (
    <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium tracking-normal text-primary">
      {t("demo.badge")}
    </span>
  );
}

/** Licence credit, with its URL turned into a link. */
export function Credit({ text }: { text: string }) {
  const [before, url, after] = text.split(/(https?:\/\/\S+)/);
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {before}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
          {url.replace(/^https?:\/\//, "")}
        </a>
      )}
      {after}
    </p>
  );
}
