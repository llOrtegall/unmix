import { describe, expect, it } from "vitest";
import { StemName } from "../../../track/domain/StemName.ts";
import { Channel } from "../../domain/Channel.ts";
import { ChannelList } from "../../domain/ChannelList.ts";
import { DuplicatedChannelError } from "../../domain/errors/DuplicatedChannelError.ts";
import { InvalidPlayheadError } from "../../domain/errors/InvalidPlayheadError.ts";
import { InvalidVolumeError } from "../../domain/errors/InvalidVolumeError.ts";
import { UnknownChannelError } from "../../domain/errors/UnknownChannelError.ts";
import { Mix } from "../../domain/Mix.ts";
import { Playhead } from "../../domain/Playhead.ts";
import { Volume } from "../../domain/Volume.ts";
import * as MixMother from "../helpers/MixMother.ts";

const stem = (name: string) => StemName.create(name);
const audible = (mix: Mix) => mix.map((channel) => channel.getName()).filter((name) => mix.isAudible(name)).map((name) => name.toPrimitive());

describe("Mix", () => {
  describe("Basic behaviour", () => {
    it("plays every channel at the default volume", () => {
      const mix = MixMother.create();

      expect(audible(mix)).toEqual(["vocals", "drums", "bass", "guitar", "piano", "other"]);
      expect(mix.gainOf(stem("vocals")).toPrimitive()).toBe(0.8);
    });

    it("silences only a muted channel", () => {
      const mix = MixMother.create().toggleMute(stem("drums"));

      expect(mix.gainOf(stem("drums")).toPrimitive()).toBe(0);
      expect(mix.isAudible(stem("bass"))).toBe(true);
      expect(mix.toggleMute(stem("drums")).isAudible(stem("drums"))).toBe(true);
    });

    it("lets solo win over mute and silences the rest", () => {
      const mix = MixMother.create().toggleMute(stem("vocals")).toggleSolo(stem("vocals")).toggleSolo(stem("bass"));

      expect(audible(mix)).toEqual(["vocals", "bass"]);
    });

    it("keeps a single channel with an exclusive solo, and clears it on a second one", () => {
      const mix = MixMother.create().toggleSolo(stem("vocals")).toggleExclusiveSolo(stem("guitar"));

      expect(audible(mix)).toEqual(["guitar"]);
      expect(audible(mix.toggleExclusiveSolo(stem("guitar")))).toHaveLength(6);
    });

    it("changes a channel's volume and reports every gain", () => {
      const mix = MixMother.create(["vocals", "bass"]).setVolume(stem("bass"), Volume.create(0.3)).toggleMute(stem("vocals"));

      expect(mix.gains().map(([name, gain]) => [name.toPrimitive(), gain.toPrimitive()])).toEqual([
        ["vocals", 0],
        ["bass", 0.3],
      ]);
    });

    it("never changes the original mix", () => {
      const mix = MixMother.create();

      mix.toggleMute(stem("piano"));
      mix.toggleExclusiveSolo(stem("bass"));

      expect(mix.equals(MixMother.create())).toBe(true);
    });

    it("survives a primitive round-trip", () => {
      const mix = MixMother.create().toggleSolo(stem("other")).setVolume(stem("piano"), Volume.create(0.1));

      expect(Mix.fromPrimitive(mix.toPrimitive()).equals(mix)).toBe(true);
      expect(Channel.fromPrimitive(mix.channelFor(stem("other")).toPrimitive()).isSoloed()).toBe(true);
    });
  });

  describe("Playhead", () => {
    it("moves to a fraction of the song", () => {
      const playhead = Playhead.create(30, 200).moveTo(0.5);

      expect(playhead.toPrimitive()).toEqual({ positionSeconds: 100, durationSeconds: 200 });
      expect(playhead.fraction()).toBe(0.5);
      expect(Playhead.create(0, 200).moveTo(1.4).fraction()).toBe(1);
      expect(Playhead.fromPrimitive(playhead.toPrimitive()).equals(playhead)).toBe(true);
    });

    it("has no progress before the audio is loaded", () => {
      expect(Playhead.start().fraction()).toBe(0);
      expect(Playhead.start().moveTo(0.5).fraction()).toBe(0);
    });
  });

  describe("Error scenarios", () => {
    it.each([-0.1, 1.1, Number.NaN])("rejects a volume of %s", (value) => {
      expect(() => Volume.create(value)).toThrow(InvalidVolumeError);
    });

    it("rejects a channel the mix does not have", () => {
      expect(() => MixMother.create(["vocals"]).toggleMute(stem("bass"))).toThrow(UnknownChannelError);
    });

    it("rejects the same channel twice", () => {
      expect(() => ChannelList.forStems([stem("bass"), stem("bass")])).toThrow(DuplicatedChannelError);
    });

    it("rejects a negative playhead", () => {
      expect(() => Playhead.create(-1, 10)).toThrow(InvalidPlayheadError);
    });
  });
});
