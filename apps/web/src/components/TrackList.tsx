import { Music2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useT } from "@/i18n/useT.ts";
import type { TrackList as TrackListValue } from "@/modules/track/domain/TrackList.ts";
import type { TrackSummary } from "@/modules/track/domain/TrackSummary.ts";
import { TrackRow } from "./TrackRow.tsx";

interface Props {
  readonly trackList: TrackListValue | null;
  readonly loadError: string | null;
  readonly notice: string | null;
  readonly hasMore: boolean;
  readonly onRetry: () => void;
  readonly onLoadMore: () => void;
  readonly onDelete: (track: TrackSummary) => void;
}

export function TrackList({ trackList, loadError, notice, hasMore, onRetry, onLoadMore, onDelete }: Props) {
  const t = useT();
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
      {trackList === null && loadError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center text-sm text-muted-foreground">
          {loadError}
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw />
            {t("common.retry")}
          </Button>
        </div>
      ) : trackList === null ? (
        <div className="space-y-2" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : trackList.isEmpty() ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          <Music2 className="size-6" />
          {t("library.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {trackList.map((track) => (
            <TrackRow key={track.getId().toPrimitive()} track={track} onDelete={onDelete} />
          ))}
        </ul>
      )}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={onLoadMore}>
            {t("library.loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}
