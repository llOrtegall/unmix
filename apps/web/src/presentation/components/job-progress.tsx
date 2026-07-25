import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { Job } from "@/domain/job.ts";
import { STEM_ORDER } from "@/domain/stem.ts";
import { stemColor } from "@/presentation/components/stem-style.ts";
import { Button } from "@/presentation/components/ui/button.tsx";
import { Card } from "@/presentation/components/ui/card.tsx";
import { Progress } from "@/presentation/components/ui/progress.tsx";
import { errorMessage, useT } from "@/presentation/i18n/use-t.ts";
import { useServices } from "@/presentation/services.tsx";

interface Props {
  jobId: string;
  trackId: string;
  onDone: () => void;
}

export function JobProgress({ jobId, trackId, onDone }: Props) {
  const t = useT();
  const { watchJob, retrySeparation } = useServices();
  const [job, setJob] = useState<Job | null>(null);
  const [current, setCurrent] = useState(jobId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    return watchJob.execute(
      current,
      (update) => {
        setJob(update);
        if (update.status === "completed") onDone();
      },
      (e) => setError(errorMessage(t, e.code)),
    );
  }, [current, watchJob, onDone, t]);

  async function retry() {
    const result = await retrySeparation.execute(trackId);
    if (result.ok) {
      setJob(result.value);
      setCurrent(result.value.id);
    } else setError(errorMessage(t, result.error.code));
  }

  if (job?.status === "failed") {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-red-300">
          <AlertTriangle className="size-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("job.failed")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{errorMessage(t, job.error?.code ?? "")}</p>
        </div>
        {job.error?.code !== "separation.duration_exceeded" && job.error?.code !== "separation.invalid_media" && (
          <Button onClick={retry}>
            <RotateCcw />
            {t("job.retry")}
          </Button>
        )}
      </Card>
    );
  }

  const percent = job?.progress ?? 0;
  const stageKey = job?.stage && job.status === "processing" ? (`stage.${job.stage}` as const) : "stage.queued";
  return (
    <Card className="flex flex-col items-center gap-6 p-8 text-center sm:p-12" aria-live="polite">
      <div className="flex h-12 items-end gap-1.5" aria-hidden>
        {STEM_ORDER.map((name, i) => (
          <span
            key={name}
            className="w-2 animate-pulse rounded-full"
            style={{ background: stemColor(name), height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
      <div>
        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Sparkles className="size-4 text-primary" />
          {t("job.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(stageKey)}</p>
      </div>
      <div className="w-full max-w-md">
        <Progress value={percent} aria-label={`${percent}%`} />
        <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">{percent}%</p>
      </div>
      <p className="max-w-sm text-xs text-muted-foreground">{t("job.hint")}</p>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </Card>
  );
}
