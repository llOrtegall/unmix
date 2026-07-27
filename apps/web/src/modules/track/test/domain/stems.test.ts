import { describe, expect, it } from "vitest";
import { DuplicatedStemError } from "../../domain/errors/DuplicatedStemError.ts";
import { Stem } from "../../domain/Stem.ts";
import { StemList } from "../../domain/StemList.ts";
import { StemName } from "../../domain/StemName.ts";
import { WaveformPeaks } from "../../domain/WaveformPeaks.ts";
import { Waveforms } from "../../domain/Waveforms.ts";
import * as StemMother from "../helpers/StemMother.ts";

describe("stems", () => {
  describe("Basic behaviour", () => {
    it("survive a primitive round-trip", () => {
      const primitive = StemMother.createPrimitive();

      expect(Stem.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("know whether they have MIDI and content", () => {
      expect(StemMother.create({ name: "drums", midiUrl: null }).hasMidi()).toBe(false);
      expect(StemMother.create({ name: "bass" }).hasMidi()).toBe(true);
      expect(StemMother.create({ silent: true }).isSilent()).toBe(true);
    });

    it("sorts the list in mixer order", () => {
      const stems = StemMother.list(["other", "piano", "vocals", "bass"]);

      expect(stems.names().map((name) => name.toPrimitive())).toEqual(["vocals", "bass", "piano", "other"]);
      expect(stems.count()).toBe(4);
      expect(StemList.empty().isEmpty()).toBe(true);
    });

    it("survives a list round-trip and compares by content", () => {
      const stems = StemMother.list();

      expect(StemList.fromPrimitive(stems.toPrimitive()).equals(stems)).toBe(true);
      expect(stems.equals(StemMother.list(["vocals"]))).toBe(false);
    });

    it("keeps the peaks of each stem and the loudest of all", () => {
      const waveforms = Waveforms.create([
        [StemName.create("vocals"), WaveformPeaks.create([0.2, 0.7])],
        [StemName.create("bass"), WaveformPeaks.create([0.9])],
      ]);

      expect(waveforms.peaksFor(StemName.create("vocals")).toPrimitive()).toEqual([0.2, 0.7]);
      expect(waveforms.loudest()).toBe(0.9);
      expect(Waveforms.fromPrimitive(waveforms.toPrimitive()).equals(waveforms)).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("draws no waveform for a stem without peaks", () => {
      expect(Waveforms.empty().peaksFor(StemName.create("piano")).isEmpty()).toBe(true);
      expect(Waveforms.empty().loudest()).toBe(0);
    });
  });

  describe("Error scenarios", () => {
    it("rejects the same stem twice", () => {
      expect(() => StemList.fromPrimitive(StemMother.listPrimitive(["bass", "bass"]))).toThrow(DuplicatedStemError);
    });
  });
});
