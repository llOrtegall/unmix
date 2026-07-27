import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";
import type { Playhead } from "../domain/Playhead.ts";

export const findPlayhead =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  (): Playhead =>
    playbackRepository.playhead();
