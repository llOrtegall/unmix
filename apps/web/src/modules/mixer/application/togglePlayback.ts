import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";

export const togglePlayback =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  async (): Promise<boolean> => {
    if (playbackRepository.isPlaying()) {
      playbackRepository.pause();
      return false;
    }
    await playbackRepository.play();
    return true;
  };
