import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";

export const watchPlaybackEnd =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  (listener: () => void): Unsubscribe =>
    playbackRepository.onEnded(listener);
