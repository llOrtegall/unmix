import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";
import type { Playhead } from "../domain/Playhead.ts";

export const seekTo =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  (fraction: number): Playhead => {
    const playhead = playbackRepository.playhead().moveTo(fraction);
    playbackRepository.seek(playhead);
    return playhead;
  };
