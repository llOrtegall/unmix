import { StemName } from "../../track/domain/StemName.ts";
import type { Mix } from "../domain/Mix.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";
import { Volume } from "../domain/Volume.ts";

export interface SetChannelVolumeInput {
  readonly mix: Mix;
  readonly stem: string;
  readonly volume: number;
}

export const setChannelVolume =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  ({ mix, stem, volume }: SetChannelVolumeInput): Mix => {
    const updated = mix.setVolume(StemName.create(stem), Volume.create(volume));
    playbackRepository.apply(updated);
    return updated;
  };
