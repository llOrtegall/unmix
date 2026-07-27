import type { StemList } from "../../track/domain/StemList.ts";
import { Mix } from "../domain/Mix.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";

export const loadMix =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  async (stems: StemList): Promise<Mix> => {
    const mix = Mix.forStems(stems.names());
    await playbackRepository.load(stems);
    playbackRepository.apply(mix);
    return mix;
  };
