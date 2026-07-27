import { describe, expect, it, vi } from "vitest";
import * as StemMother from "../../../track/test/helpers/StemMother.ts";
import { StemName } from "../../../track/domain/StemName.ts";
import { findPlayhead } from "../../application/findPlayhead.ts";
import { loadMix } from "../../application/loadMix.ts";
import { seekTo } from "../../application/seekTo.ts";
import { setChannelVolume } from "../../application/setChannelVolume.ts";
import { toggleChannelMute } from "../../application/toggleChannelMute.ts";
import { toggleChannelSolo } from "../../application/toggleChannelSolo.ts";
import { toggleExclusiveChannelSolo } from "../../application/toggleExclusiveChannelSolo.ts";
import { togglePlayback } from "../../application/togglePlayback.ts";
import { unloadMix } from "../../application/unloadMix.ts";
import { watchPlaybackEnd } from "../../application/watchPlaybackEnd.ts";
import { PlaybackLoadFailedError } from "../../domain/errors/PlaybackLoadFailedError.ts";
import { Playhead } from "../../domain/Playhead.ts";
import * as MixMother from "../helpers/MixMother.ts";
import * as PlaybackRepositoryMother from "../helpers/PlaybackRepositoryMother.ts";

describe("loadMix", () => {
  it("loads the stems and applies a mix with a channel per stem", async () => {
    const playbackRepository = PlaybackRepositoryMother.create();
    const stems = StemMother.list(["bass", "vocals"]);

    const mix = await loadMix({ playbackRepository })(stems);

    expect(mix.equals(MixMother.create(["vocals", "bass"]))).toBe(true);
    expect(playbackRepository.load).toHaveBeenCalledWith(stems);
    expect(playbackRepository.apply).toHaveBeenCalledWith(mix);
  });

  it("fails without applying a mix when a stem cannot be loaded", async () => {
    const playbackRepository = PlaybackRepositoryMother.create({ load: vi.fn().mockRejectedValue(new PlaybackLoadFailedError("bass")) });

    await expect(loadMix({ playbackRepository })(StemMother.list())).rejects.toThrow(PlaybackLoadFailedError);
    expect(playbackRepository.apply).not.toHaveBeenCalled();
  });
});

describe("togglePlayback", () => {
  it("plays when paused and pauses when playing", async () => {
    const paused = PlaybackRepositoryMother.create();
    const playing = PlaybackRepositoryMother.create({ isPlaying: vi.fn().mockReturnValue(true) });

    expect(await togglePlayback({ playbackRepository: paused })()).toBe(true);
    expect(await togglePlayback({ playbackRepository: playing })()).toBe(false);
    expect(paused.play).toHaveBeenCalledOnce();
    expect(playing.pause).toHaveBeenCalledOnce();
  });
});

describe("seekTo and findPlayhead", () => {
  it("moves every stem to a fraction of the song", () => {
    const playbackRepository = PlaybackRepositoryMother.create({ playhead: vi.fn().mockReturnValue(Playhead.create(10, 300)) });

    const playhead = seekTo({ playbackRepository })(0.25);

    expect(playhead.toPrimitive().positionSeconds).toBe(75);
    expect(playbackRepository.seek).toHaveBeenCalledWith(playhead);
    expect(findPlayhead({ playbackRepository })()).toEqual(Playhead.create(10, 300));
  });
});

describe("channel changes", () => {
  it.each([
    ["volume", () => setChannelVolume, { volume: 0.5 }],
    ["mute", () => toggleChannelMute, {}],
    ["solo", () => toggleChannelSolo, {}],
    ["exclusive solo", () => toggleExclusiveChannelSolo, {}],
  ] as const)("apply the new %s and return the new mix", (_, useCase, extra) => {
    const playbackRepository = PlaybackRepositoryMother.create();
    const mix = MixMother.create();

    const updated = useCase()({ playbackRepository })({ mix, stem: "drums", volume: 0.5, ...extra });

    expect(updated.equals(mix)).toBe(false);
    expect(playbackRepository.apply).toHaveBeenCalledWith(updated);
  });

  it("changes only the chosen channel", () => {
    const mix = toggleChannelMute({ playbackRepository: PlaybackRepositoryMother.create() })({ mix: MixMother.create(), stem: "drums" });

    expect(mix.isAudible(StemName.create("drums"))).toBe(false);
    expect(mix.isAudible(StemName.create("vocals"))).toBe(true);
  });
});

describe("unloadMix and watchPlaybackEnd", () => {
  it("release the audio and follow the end of the song", () => {
    const stop = vi.fn();
    const playbackRepository = PlaybackRepositoryMother.create({ onEnded: vi.fn().mockReturnValue(stop) });
    const listener = vi.fn();

    unloadMix({ playbackRepository })();

    expect(playbackRepository.unload).toHaveBeenCalledOnce();
    expect(watchPlaybackEnd({ playbackRepository })(listener)).toBe(stop);
    expect(playbackRepository.onEnded).toHaveBeenCalledWith(listener);
  });
});
