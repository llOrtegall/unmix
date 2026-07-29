import { Download, FileMusic, Headphones, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Slider } from "@/components/ui/slider.tsx";
import { useT } from "@/i18n/useT.ts";
import { cn, formatBytes } from "@/lib/utils.ts";
import type { Channel } from "@/modules/mixer/domain/Channel.ts";
import type { Stem } from "@/modules/track/domain/Stem.ts";
import type { WaveformPeaks } from "@/modules/track/domain/WaveformPeaks.ts";
import { stemColor } from "./stemColor.ts";
import { Waveform } from "./Waveform.tsx";

const PERCENT = 100;

interface Props {
  readonly stem: Stem;
  readonly channel: Channel;
  readonly isAudible: boolean;
  readonly peaks: WaveformPeaks;
  readonly loudest: number;
  readonly progress: number;
  readonly onSeek: (fraction: number) => void;
  readonly onVolume: (volume: number) => void;
  readonly onMute: () => void;
  readonly onSolo: (isExclusive: boolean) => void;
}

export function StemLane({ stem, channel, isAudible, peaks, loudest, progress, onSeek, onVolume, onMute, onSolo }: Props) {
  const t = useT();
  const color = stemColor(stem.getName());
  const name = t(`stem.${stem.getName().toPrimitive()}`);
  const midiUrl = stem.getMidiUrl();

  return (
    <Card
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 p-3 transition-opacity sm:grid-cols-[11rem_1fr_auto] sm:p-4",
        !isAudible && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
        <span className="shrink-0 font-medium">{name}</span>
        {stem.isSilent() && (
          <Badge variant="outline" className="min-w-0 truncate" title={t("mixer.silentHint")}>
            {t("mixer.silent")}
          </Badge>
        )}
      </div>

      <div className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <Waveform peaks={peaks} color={color} progress={progress} loudest={loudest} isDimmed={!isAudible} label={name} onSeek={onSeek} />
      </div>

      <div className="flex items-center gap-1.5 sm:col-start-3">
        <Button
          variant={channel.isMuted() ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={channel.isMuted()}
          aria-label={`${t("mixer.mute")} ${name}`}
          title={t("mixer.mute")}
          onClick={onMute}
          className={cn(channel.isMuted() && "text-amber-300")}
        >
          <VolumeX />
        </Button>
        <Button
          variant={channel.isSoloed() ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={channel.isSoloed()}
          aria-label={`${t("mixer.solo")} ${name}`}
          title={t("mixer.solo")}
          onClick={(event) => onSolo(event.shiftKey)}
          style={channel.isSoloed() ? { color } : undefined}
        >
          <Headphones />
        </Button>
        <Slider
          className="w-20 sm:w-24"
          style={{ ["--slider-color" as string]: color }}
          value={[channel.getVolume().toPrimitive() * PERCENT]}
          max={PERCENT}
          step={1}
          aria-label={t("mixer.volume", { stem: name })}
          onValueChange={([value]) => onVolume((value ?? 0) / PERCENT)}
        />
        <Button variant="ghost" size="icon-sm" asChild title={`${t("mixer.download")} · ${formatBytes(stem.getSize().toPrimitive())}`}>
          <a href={stem.getDownloadUrl().toPrimitive()} download aria-label={`${t("mixer.download")} ${name}`}>
            <Download />
          </a>
        </Button>
        {midiUrl ? (
          <Button variant="ghost" size="icon-sm" asChild title={t("mixer.midiHint")}>
            <a href={midiUrl.toPrimitive()} download aria-label={`${t("mixer.downloadMidi")} ${name}`}>
              <FileMusic />
            </a>
          </Button>
        ) : (
          // Keeps the controls aligned on stems without notes (drums, silent ones).
          <span aria-hidden className="size-8 shrink-0" />
        )}
      </div>
    </Card>
  );
}
