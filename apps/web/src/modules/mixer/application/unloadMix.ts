import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";

export const unloadMix =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  (): void =>
    playbackRepository.unload();
