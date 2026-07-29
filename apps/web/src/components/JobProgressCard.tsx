import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { useT } from "@/i18n/useT.ts";
import type { Job } from "@/modules/separation/domain/Job.ts";
import { StemName } from "@/modules/track/domain/StemName.ts";
import { stemColor } from "./stemColor.ts";

interface Props {
  readonly job: Job | null;
  readonly error: string | null;
}

const STEMS = StemName.all();

export function JobProgressCard({ job, error }: Props) {
  const t = useT();
  const percent = job?.getProgress().toPrimitive() ?? 0;
  const stage = job?.activeStage();
  return (
    <Card className="flex flex-col items-center gap-6 p-8 text-center sm:p-12" aria-live="polite">
      <div className="flex h-12 items-end gap-1.5" aria-hidden>
        {STEMS.map((name, i) => (
          <span
            key={name.toPrimitive()}
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
        <p className="mt-1 text-sm text-muted-foreground">{t(stage ? `stage.${stage.toPrimitive()}` : "stage.queued")}</p>
      </div>
      <div className="w-full max-w-md">
        <Progress value={percent} aria-label={`${percent}%`} />
        <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">{percent}%</p>
      </div>
      <p className="max-w-sm text-xs text-muted-foreground">{t("job.hint")}</p>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </Card>
  );
}
