import { StemName } from "../../track/domain/StemName.ts";
import type { Mix } from "../domain/Mix.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";

export interface ChannelCommand {
  readonly mix: Mix;
  readonly stem: string;
}

export const toggleChannelMute =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  ({ mix, stem }: ChannelCommand): Mix => {
    const updated = mix.toggleMute(StemName.create(stem));
    playbackRepository.apply(updated);
    return updated;
  };
