import { describe, expect, it } from "vitest";
import { DuplicatedStemError } from "../../domain/errors/DuplicatedStemError.ts";
import { MissingStemUrlsError } from "../../domain/errors/MissingStemUrlsError.ts";
import { PlayableStem, type PlayableStemPrimitive } from "../../domain/PlayableStem.ts";
import { PlayableStemList } from "../../domain/PlayableStemList.ts";
import { PlayableTrack } from "../../domain/PlayableTrack.ts";
import type { StemPrimitive } from "../../domain/Stem.ts";
import * as TrackMother from "../helpers/TrackMother.ts";

const playable = (stem: StemPrimitive): PlayableStemPrimitive => ({
  stem,
  downloadUrl: `https://storage.test/${stem.key}`,
  previewUrl: `https://storage.test/${stem.previewKey}`,
  peaksUrl: `https://storage.test/${stem.peaksKey}`,
  midiUrl: stem.midiKey ? `https://storage.test/${stem.midiKey}` : null,
});

describe("PlayableTrack", () => {
  it("survives a primitive round-trip", () => {
    const track = TrackMother.completed().toPrimitive();
    const primitive = { track, stems: track.stems.map(playable) };

    expect(PlayableTrack.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("compares the track and its stems", () => {
    const track = TrackMother.completed().toPrimitive();
    const primitive = { track, stems: track.stems.map(playable) };

    expect(PlayableTrack.fromPrimitive(primitive).equals(PlayableTrack.fromPrimitive(primitive))).toBe(true);
    expect(PlayableTrack.fromPrimitive(primitive).getTrack().getId().toPrimitive()).toBe(track.id);
  });

  it("rejects a track whose stems are not all signed", () => {
    const track = TrackMother.completed();

    expect(() => PlayableTrack.create(track, PlayableStemList.empty())).toThrow(MissingStemUrlsError);
  });

  it("rejects the same stem twice", () => {
    const stem = playable(TrackMother.completed().toPrimitive().stems[0]!);

    expect(() => PlayableStemList.create([PlayableStem.fromPrimitive(stem), PlayableStem.fromPrimitive(stem)])).toThrow(
      DuplicatedStemError,
    );
  });
});
