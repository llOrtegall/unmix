import { Download, FileMusic, Headphones, Loader2, Pause, Play, SkipBack, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isAudible } from "@/domain/mix.ts";
import type { Stem, StemName } from "@/domain/stem.ts";
import type { Track } from "@/domain/track.ts";
import { stemColor } from "@/presentation/components/stem-style.ts";
import { Badge } from "@/presentation/components/ui/badge.tsx";
import { Button } from "@/presentation/components/ui/button.tsx";
import { Card } from "@/presentation/components/ui/card.tsx";
import { Slider } from "@/presentation/components/ui/slider.tsx";
import { useT } from "@/presentation/i18n/use-t.ts";
import { cn, formatBytes, formatDuration } from "@/presentation/lib/utils.ts";
import { useServices } from "@/presentation/services.tsx";
import { useMixer } from "@/presentation/stores/mixer-store.ts";
import { Waveform } from "./waveform.tsx";

interface Props {
  track: Track;
  peaks: Partial<Record<StemName, number[]>>;
}

export function Mixer({ track, peaks }: Props) {
  const t = useT();
  const { createAudioEngine, tracks } = useServices();
  const { status, playing, duration, load, togglePlay, seek, dispose } = useMixer();
  const time = usePlaybackTime();

  useEffect(() => {
    void load(track.stems, createAudioEngine());
    return () => dispose();
  }, [track, createAudioEngine, load, dispose]);

  // Space toggles playback unless the user is typing or on a control.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.code !== "Space" || ["INPUT", "BUTTON", "TEXTAREA"].includes(target.tagName) || target.getAttribute("role") === "slider") return;
      e.preventDefault();
      void togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay]);

  const progress = duration ? time / duration : 0;
  const ready = status === "ready";
  const loudest = useMemo(() => Math.max(0, ...Object.values(peaks).flatMap((p) => p ?? [])), [peaks]);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <Button size="icon" className="size-11 rounded-full" onClick={() => void togglePlay()} disabled={!ready} aria-label={playing ? t("mixer.pause") : t("mixer.play")}>
          {status === "loading" ? <Loader2 className="animate-spin" /> : playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => seek(0)} disabled={!ready} aria-label={t("mixer.restart")}>
          <SkipBack />
        </Button>
        <div className="font-mono text-sm tabular-nums text-muted-foreground" aria-live="off">
          <span className="text-foreground">{formatDuration(time)}</span> / {formatDuration(duration || track.durationSeconds)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {status === "loading" && <span className="text-xs text-muted-foreground">{t("mixer.loading")}</span>}
          <Button variant="secondary" asChild>
            <a href={tracks.zipUrl(track.id)} download>
              <Download />
              <span className="hidden sm:inline">{t("mixer.downloadAll")}</span>
              <span className="sm:hidden">ZIP</span>
            </a>
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {track.stems.map((stem) => (
          <StemLane key={stem.name} stem={stem} peaks={peaks[stem.name] ?? []} max={loudest} progress={progress} onSeek={(f) => seek(f * duration)} />
        ))}
      </div>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">{t("mixer.soloHint")}</p>
    </div>
  );
}

function StemLane({ stem, peaks, max, progress, onSeek }: { stem: Stem; peaks: number[]; max: number; progress: number; onSeek: (fraction: number) => void }) {
  const t = useT();
  const { mix, setVolume, toggleMute, toggleSolo } = useMixer();
  const channel = mix[stem.name];
  if (!channel) return null;
  const audible = isAudible(mix, stem.name);
  const color = stemColor(stem.name);
  const name = t(`stem.${stem.name}`);

  return (
    <Card className={cn("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 p-3 transition-opacity sm:grid-cols-[11rem_1fr_auto] sm:p-4", !audible && "opacity-60")}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
        <span className="shrink-0 font-medium">{name}</span>
        {stem.silent && (
          <Badge variant="outline" className="min-w-0 truncate" title={t("mixer.silentHint")}>
            {t("mixer.silent")}
          </Badge>
        )}
      </div>

      <div className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <Waveform peaks={peaks} color={color} progress={progress} max={max} dimmed={!audible} label={name} onSeek={onSeek} />
      </div>

      <div className="flex items-center gap-1.5 sm:col-start-3">
        <Button
          variant={channel.muted ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={channel.muted}
          aria-label={`${t("mixer.mute")} ${name}`}
          title={t("mixer.mute")}
          onClick={() => toggleMute(stem.name)}
          className={cn(channel.muted && "text-amber-300")}
        >
          <VolumeX />
        </Button>
        <Button
          variant={channel.soloed ? "secondary" : "ghost"}
          size="icon-sm"
          aria-pressed={channel.soloed}
          aria-label={`${t("mixer.solo")} ${name}`}
          title={t("mixer.solo")}
          onClick={(e) => toggleSolo(stem.name, e.shiftKey)}
          style={channel.soloed ? { color } : undefined}
        >
          <Headphones />
        </Button>
        <Slider
          className="w-20 sm:w-24"
          style={{ ["--slider-color" as string]: color }}
          value={[channel.volume * 100]}
          max={100}
          step={1}
          aria-label={t("mixer.volume", { stem: name })}
          onValueChange={([v]) => setVolume(stem.name, (v ?? 0) / 100)}
        />
        <Button variant="ghost" size="icon-sm" asChild title={`${t("mixer.download")} · ${formatBytes(stem.sizeBytes)}`}>
          <a href={stem.downloadUrl} download aria-label={`${t("mixer.download")} ${name}`}>
            <Download />
          </a>
        </Button>
        {stem.midiUrl ? (
          <Button variant="ghost" size="icon-sm" asChild title={t("mixer.midiHint")}>
            <a href={stem.midiUrl} download aria-label={`${t("mixer.downloadMidi")} ${name}`}>
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

/** Reads the engine clock once per frame while playing; keeps the store free of 60 fps updates. */
function usePlaybackTime(): number {
  const engine = useMixer((s) => s.engine);
  const playing = useMixer((s) => s.playing);
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!engine) return;
    let frame = 0;
    const tick = () => {
      setTime(engine.currentTime);
      if (playing) frame = requestAnimationFrame(tick);
    };
    tick();
    // Paused: still pick up seeks.
    const poll = playing ? 0 : window.setInterval(() => setTime(engine.currentTime), 200);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(poll);
    };
  }, [engine, playing]);
  return time;
}
