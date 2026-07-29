import { ChevronRight, Music2, Trash2 } from "lucide-react";
import { Link } from "wouter";
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
import { useLocale, useT } from "@/i18n/useT.ts";
import { formatDuration } from "@/lib/utils.ts";
import type { TrackSummary } from "@/modules/track/domain/TrackSummary.ts";
import { DemoBadge } from "./DemoBadge.tsx";
import { StatusBadge } from "./StatusBadge.tsx";

interface Props {
  readonly track: TrackSummary;
  readonly onDelete: (track: TrackSummary) => void;
}

export function TrackRow({ track, onDelete }: Props) {
  const t = useT();
  const locale = useLocale((state) => state.locale);
  const title = track.getTitle().toPrimitive();
  const date = track.getCreatedAt().toDate().toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="group flex items-center gap-2 rounded-xl border bg-card pr-2 transition-colors hover:bg-accent/60">
      <Link
        href={`/tracks/${track.getId().toPrimitive()}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-xl p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Music2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-medium">
            <span className="truncate">{title}</span>
            {track.isDemo() && <DemoBadge />}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDuration(track.getDuration()?.toPrimitive())} · {date}
          </p>
        </div>
        <StatusBadge status={track.getStatus()} />
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("library.delete")} disabled={!track.canBeDeleted()}>
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>{t("library.deleteTitle", { title })}</AlertDialogTitle>
          <AlertDialogDescription>{t("library.deleteBody")}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("library.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(track)}>{t("library.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
