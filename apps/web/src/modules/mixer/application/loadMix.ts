import type { StemList } from "../../track/domain/StemList.ts";
import { Mix } from "../domain/Mix.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";

export interface LoadingMix {
  readonly mix: Mix;
  readonly ready: Promise<void>;
}

// The mix exists while the audio loads, so the channels can be changed before playback.
export const loadMix =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  (stems: StemList): LoadingMix => {
    const mix = Mix.forStems(stems.names());
    const ready = playbackRepository.load(stems);
    playbackRepository.apply(mix);
    return { mix, ready };
  };
