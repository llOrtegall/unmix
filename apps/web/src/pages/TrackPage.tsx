import { ArrowLeft, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { JobProgress } from "@/components/JobProgress.tsx";
import { Mixer } from "@/components/Mixer.tsx";
import { TrackHeader } from "@/components/TrackHeader.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useDocumentTitle } from "@/hooks/useDocumentTitle.ts";
import { useTrack } from "@/hooks/useTrack.ts";
import { useErrorMessage } from "@/i18n/errorMessages.ts";
import { useT } from "@/i18n/useT.ts";
import { NotFoundError } from "@/modules/shared/domain/DomainError.ts";

export function TrackPage({ id }: { id: string }) {
  const t = useT();
  const messageFor = useErrorMessage();
  const { found, error, reload, retry } = useTrack(id);
  const track = found?.track;
  const latestJob = track?.getLatestJob();
  useDocumentTitle(track?.getSummary().getTitle().toPrimitive());

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
        <Card className="flex flex-col items-center gap-4 p-8 text-center text-sm text-muted-foreground">
          {messageFor(error)}
          {error instanceof NotFoundError ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/">{t("app.library")}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={retry}>
              <RotateCw />
              {t("common.retry")}
            </Button>
          )}
        </Card>
      ) : !found || !track ? (
        <div className="space-y-3" aria-busy>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-card" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : (
        <>
          <TrackHeader track={track.getSummary()} />
          {track.isReady() ? (
            <Mixer track={track} waveforms={found.waveforms} />
          ) : latestJob ? (
            <JobProgress jobId={latestJob.toPrimitive()} trackId={track.getSummary().getId().toPrimitive()} onFinished={reload} />
          ) : (
            <Card className="p-8 text-center text-sm text-muted-foreground">{t("error.track.upload_missing")}</Card>
          )}
        </>
      )}
    </div>
  );
}
