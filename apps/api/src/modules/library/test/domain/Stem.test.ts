import { describe, expect, it } from "vitest";
import { InvalidStemNameError } from "../../domain/errors/InvalidStemNameError.ts";
import { Stem } from "../../domain/Stem.ts";
import { TrackTitle } from "../../domain/TrackTitle.ts";
import * as StemMother from "../helpers/StemMother.ts";

describe("Stem", () => {
  it("survives a primitive round-trip, with and without MIDI", () => {
    const withMidi = StemMother.createPrimitive();
    const withoutMidi = StemMother.createPrimitive({ name: "drums", midiKey: null });

    expect(Stem.fromPrimitive(withMidi).toPrimitive()).toEqual(withMidi);
    expect(Stem.fromPrimitive(withoutMidi).toPrimitive()).toEqual(withoutMidi);
  });

  it("names its downloads after the track", () => {
    const stem = StemMother.create({ name: "bass" });
    const title = TrackTitle.create("La");

    expect(stem.downloadFilename(title)).toBe("La - bass.flac");
    expect(stem.midiFilename(title)).toBe("La - bass.mid");
  });

  it("compares every attribute", () => {
    const primitive = StemMother.createPrimitive();

    expect(Stem.fromPrimitive(primitive).equals(Stem.fromPrimitive(primitive))).toBe(true);
    expect(Stem.fromPrimitive(primitive).equals(Stem.fromPrimitive({ ...primitive, midiKey: null }))).toBe(false);
    expect(Stem.fromPrimitive({ ...primitive, silent: true }).isSilent()).toBe(true);
  });

  it("rejects invalid data when rehydrating", () => {
    expect(() => Stem.fromPrimitive({ ...StemMother.createPrimitive(), name: "kazoo" as "vocals" })).toThrow(
      InvalidStemNameError,
    );
  });
});
