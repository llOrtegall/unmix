import { ChevronRight, Music2, RotateCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import type { TrackSummary } from "@/domain/track.ts";
import { StatusBadge } from "@/presentation/components/status-badge.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { errorMessage, useLocale, useT } from "@/presentation/i18n/use-t.ts";
import { formatDuration } from "@/lib/utils.ts";
import { DemoBadge } from "@/presentation/components/demo-credit.tsx";
import { useServices } from "@/presentation/services.tsx";

export function TrackList() {
  const t = useT();
  const { tracks } = useServices();
  const [items, setItems] = useState<TrackSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const page = await tracks.listTracks();
    if (page.ok) {
      setItems(page.value.items);
      setCursor(page.value.nextCursor);
      setLoadError(null);
    } else {
      setLoadError(page.error.code);
    }
  }, [tracks]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Keep separating songs fresh without a socket per row.
  const busy = items?.some((i) => i.status === "separating");
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(id);
  }, [busy, refresh]);

  async function loadMore() {
    if (!cursor) return;
    const page = await tracks.listTracks(cursor);
    if (page.ok) {
      setItems((prev) => [...(prev ?? []), ...page.value.items]);
      setCursor(page.value.nextCursor);
    } else {
      setNotice(errorMessage(t, page.error.code));
    }
  }

  async function remove(id: string) {
    const result = await tracks.deleteTrack(id);
    if (result.ok) setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
    else setNotice(errorMessage(t, result.error.code));
  }

  return (
    <section aria-labelledby="library-title" className="mt-10">
      <h2 id="library-title" className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {t("library.title")}
      </h2>
      {notice && (
        <p role="alert" className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          {notice}
        </p>
      )}
      {items === null && loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center text-sm text-muted-foreground">
          {errorMessage(t, loadError)}
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RotateCw />
            {t("common.retry")}
          </Button>
        </div>
      ) : items === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          <Music2 className="size-6" />
          {t("library.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <TrackRow key={item.id} item={item} onDelete={() => remove(item.id)} />
          ))}
        </ul>
      )}
      {cursor && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            {t("library.loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}

function TrackRow({ item, onDelete }: { item: TrackSummary; onDelete: () => void }) {
  const t = useT();
  const locale = useLocale((s) => s.locale);
  const date = item.createdAt.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="group flex items-center gap-2 rounded-xl border bg-card pr-2 transition-colors hover:bg-accent/60">
      <Link href={`/tracks/${item.id}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Music2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium">
            <span className="truncate">{item.title}</span>
            {item.credit && <DemoBadge />}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDuration(item.durationSeconds)} · {date}
          </p>
        </div>
        <StatusBadge status={item.status} />
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("library.delete")} disabled={item.status === "separating"}>
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>{t("library.deleteTitle", { title: item.title })}</AlertDialogTitle>
          <AlertDialogDescription>{t("library.deleteBody")}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("library.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>{t("library.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
