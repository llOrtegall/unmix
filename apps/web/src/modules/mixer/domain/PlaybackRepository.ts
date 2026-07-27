import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import type { StemList } from "../../track/domain/StemList.ts";
import type { Mix } from "./Mix.ts";
import type { Playhead } from "./Playhead.ts";

export interface PlaybackRepository {
  load(stems: StemList): Promise<void>;
  unload(): void;
  play(): Promise<void>;
  pause(): void;
  isPlaying(): boolean;
  seek(playhead: Playhead): void;
  playhead(): Playhead;
  apply(mix: Mix): void;
  onEnded(listener: () => void): Unsubscribe;
}
