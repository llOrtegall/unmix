import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import type { AppError } from "@/application/ports/index.ts";
import type { LoadedTrack } from "@/application/use-cases/track-use-cases.ts";
import { JobProgress } from "@/presentation/components/job-progress.tsx";
import { Mixer } from "@/presentation/components/mixer.tsx";
import { StatusBadge } from "@/presentation/components/status-badge.tsx";
import { Button } from "@/presentation/components/ui/button.tsx";
import { Card } from "@/presentation/components/ui/card.tsx";
import { errorMessage, useT } from "@/presentation/i18n/use-t.ts";
import { formatDuration } from "@/presentation/lib/utils.ts";
import { useServices } from "@/presentation/services.tsx";

export function TrackPage({ id }: { id: string }) {
  const t = useT();
  const { loadTrack } = useServices();
  const [data, setData] = useState<LoadedTrack | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const reload = useCallback(async () => {
    const result = await loadTrack.execute(id);
    if (result.ok) setData(result.value);
    else setError(result.error);
  }, [id, loadTrack]);

  useEffect(() => {
    setData(null);
    setError(null);
    void reload();
  }, [reload]);

  const track = data?.track;
  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/">
            <ArrowLeft />
            {t("app.library")}
          </Link>
        </Button>
      </div>

      {error ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">{errorMessage(t, error.code)}</Card>
      ) : !track ? (
        <div className="space-y-3">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-card" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{track.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{formatDuration(track.durationSeconds)}</p>
            </div>
            <StatusBadge status={track.status} />
          </header>
          {track.status === "completed" ? (
            <Mixer track={track} peaks={data.peaks} />
          ) : track.latestJobId ? (
            <JobProgress jobId={track.latestJobId} trackId={track.id} onDone={reload} />
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">{t("error.INPUT_NOT_FOUND")}</Card>
          )}
        </>
      )}
    </div>
  );
}
