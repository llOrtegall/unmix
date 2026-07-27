import { StemName } from "../../track/domain/StemName.ts";
import type { Mix } from "../domain/Mix.ts";
import type { PlaybackRepository } from "../domain/PlaybackRepository.ts";
import type { ChannelCommand } from "./toggleChannelMute.ts";

export const toggleExclusiveChannelSolo =
  ({ playbackRepository }: { playbackRepository: PlaybackRepository }) =>
  ({ mix, stem }: ChannelCommand): Mix => {
    const updated = mix.toggleExclusiveSolo(StemName.create(stem));
    playbackRepository.apply(updated);
    return updated;
  };
