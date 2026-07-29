import { useEffect } from "react";
import { useMixer } from "@/hooks/useMixer.ts";
import { usePlayhead } from "@/hooks/usePlayhead.ts";
import { useErrorMessage } from "@/i18n/errorMessages.ts";
import { useT } from "@/i18n/useT.ts";
import type { Track } from "@/modules/track/domain/Track.ts";
import type { Waveforms } from "@/modules/track/domain/Waveforms.ts";
import { MixerToolbar } from "./MixerToolbar.tsx";
import { StemLane } from "./StemLane.tsx";

const TYPING_TARGETS = ["INPUT", "BUTTON", "TEXTAREA"];

interface Props {
  readonly track: Track;
  readonly waveforms: Waveforms;
}

export function Mixer({ track, waveforms }: Props) {
  const t = useT();
  const messageFor = useErrorMessage();
  const { status, isPlaying, mix, error, load, unload, togglePlayback, seekTo, setVolume, toggleMute, toggleSolo, toggleExclusiveSolo } = useMixer();
  const playhead = usePlayhead();
  const { positionSeconds, durationSeconds } = playhead.toPrimitive();

  useEffect(() => {
    void load(track.getStems());
    return () => unload();
  }, [track, load, unload]);

  // Space toggles playback unless the user is typing or on a control.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.code !== "Space" || TYPING_TARGETS.includes(target.tagName) || target.getAttribute("role") === "slider") return;
      event.preventDefault();
      void togglePlayback();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayback]);

  const progress = playhead.fraction();
  const loudest = waveforms.loudest();

  return (
    <div className="space-y-4">
      <MixerToolbar
        isLoading={status === "loading"}
        isReady={status === "ready"}
        isPlaying={isPlaying}
        positionSeconds={positionSeconds}
        durationSeconds={durationSeconds || track.getSummary().getDuration()?.toPrimitive() || null}
        archiveUrl={track.getArchiveUrl().toPrimitive()}
        onTogglePlayback={() => void togglePlayback()}
        onRestart={() => seekTo(0)}
      />
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
          {messageFor(error)}
        </p>
      )}
      <div className="space-y-2">
        {mix &&
          track.getStems().map((stem) => {
            const name = stem.getName();
            const key = name.toPrimitive();
            return (
              <StemLane
                key={key}
                stem={stem}
                channel={mix.channelFor(name)}
                isAudible={mix.isAudible(name)}
                peaks={waveforms.peaksFor(name)}
                loudest={loudest}
                progress={progress}
                onSeek={seekTo}
                onVolume={(volume) => setVolume(key, volume)}
                onMute={() => toggleMute(key)}
                onSolo={(isExclusive) => (isExclusive ? toggleExclusiveSolo(key) : toggleSolo(key))}
              />
            );
          })}
      </div>
      <p className="hidden text-center text-xs text-muted-foreground sm:block">{t("mixer.soloHint")}</p>
    </div>
  );
}
