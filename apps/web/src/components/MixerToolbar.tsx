import { Download, Loader2, Pause, Play, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { useT } from "@/i18n/useT.ts";
import { formatDuration } from "@/lib/utils.ts";

interface Props {
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isPlaying: boolean;
  readonly positionSeconds: number;
  readonly durationSeconds: number | null;
  readonly archiveUrl: string;
  readonly onTogglePlayback: () => void;
  readonly onRestart: () => void;
}

export function MixerToolbar({ isLoading, isReady, isPlaying, positionSeconds, durationSeconds, archiveUrl, onTogglePlayback, onRestart }: Props) {
  const t = useT();
  return (
    <Card className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
      <Button
        size="icon"
        className="size-11 rounded-full"
        onClick={onTogglePlayback}
        disabled={!isReady}
        aria-label={isPlaying ? t("mixer.pause") : t("mixer.play")}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : isPlaying ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onRestart} disabled={!isReady} aria-label={t("mixer.restart")}>
        <SkipBack />
      </Button>
      <div className="font-mono text-sm tabular-nums text-muted-foreground" aria-live="off">
        <span className="text-foreground">{formatDuration(positionSeconds)}</span> / {formatDuration(durationSeconds)}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isLoading && <span className="text-xs text-muted-foreground">{t("mixer.loading")}</span>}
        <Button variant="secondary" asChild>
          <a href={archiveUrl} download>
            <Download />
            <span className="hidden sm:inline">{t("mixer.downloadAll")}</span>
            <span className="sm:hidden">ZIP</span>
          </a>
        </Button>
      </div>
    </Card>
  );
}
