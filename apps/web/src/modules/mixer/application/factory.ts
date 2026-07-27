import { HtmlAudioPlaybackRepository } from "../infrastructure/HtmlAudioPlaybackRepository.ts";
import { findPlayhead } from "./findPlayhead.ts";
import { loadMix } from "./loadMix.ts";
import { seekTo } from "./seekTo.ts";
import { setChannelVolume } from "./setChannelVolume.ts";
import { toggleChannelMute } from "./toggleChannelMute.ts";
import { toggleChannelSolo } from "./toggleChannelSolo.ts";
import { toggleExclusiveChannelSolo } from "./toggleExclusiveChannelSolo.ts";
import { togglePlayback } from "./togglePlayback.ts";
import { unloadMix } from "./unloadMix.ts";
import { watchPlaybackEnd } from "./watchPlaybackEnd.ts";

export const mixerModule = () => {
  const playbackRepository = new HtmlAudioPlaybackRepository();

  return {
    loadMix: loadMix({ playbackRepository }),
    unloadMix: unloadMix({ playbackRepository }),
    togglePlayback: togglePlayback({ playbackRepository }),
    seekTo: seekTo({ playbackRepository }),
    findPlayhead: findPlayhead({ playbackRepository }),
    watchPlaybackEnd: watchPlaybackEnd({ playbackRepository }),
    setChannelVolume: setChannelVolume({ playbackRepository }),
    toggleChannelMute: toggleChannelMute({ playbackRepository }),
    toggleChannelSolo: toggleChannelSolo({ playbackRepository }),
    toggleExclusiveChannelSolo: toggleExclusiveChannelSolo({ playbackRepository }),
  };
};

export type MixerModule = ReturnType<typeof mixerModule>;

export const mixer = mixerModule();
