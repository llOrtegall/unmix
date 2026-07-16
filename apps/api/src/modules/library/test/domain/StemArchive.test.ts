import { describe, expect, it } from "vitest";
import { ObjectKey } from "../../../shared/domain/ObjectKey.ts";
import { ArchiveEntry } from "../../domain/ArchiveEntry.ts";
import { ArchiveEntryList } from "../../domain/ArchiveEntryList.ts";
import { InvalidArchiveEntryError } from "../../domain/errors/InvalidArchiveEntryError.ts";
import { StemsNotReadyError } from "../../domain/errors/StemsNotReadyError.ts";
import { StemArchive } from "../../domain/StemArchive.ts";
import * as StemMother from "../helpers/StemMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";

describe("StemArchive", () => {
  describe("Basic behaviour", () => {
    it("packs every stem as FLAC and the transcribed ones as MIDI", () => {
      const vocals = StemMother.createPrimitive({ name: "vocals" });
      const drums = StemMother.createPrimitive({ name: "drums", midiKey: null });
      const track = TrackMother.completed({ title: "La", stems: [vocals, drums] });

      const archive = StemArchive.forTrack(track);

      expect(archive.getFilename()).toBe("La - stems.zip");
      expect(archive.getEntries().toPrimitive()).toEqual([
        { path: "vocals.flac", key: vocals.key },
        { path: "midi/vocals.mid", key: vocals.midiKey },
        { path: "drums.flac", key: drums.key },
      ]);
    });

    it("survives a primitive round-trip", () => {
      const primitive = StemArchive.forTrack(TrackMother.completed()).toPrimitive();

      expect(StemArchive.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
      expect(StemArchive.fromPrimitive(primitive).equals(StemArchive.fromPrimitive(primitive))).toBe(true);
    });
  });

  describe("Error scenarios", () => {
    it("cannot pack a track that is not completed", () => {
      expect(() => StemArchive.forTrack(TrackMother.separating())).toThrow(StemsNotReadyError);
    });

    it.each([" ", "/etc/passwd", "../outside.flac"])("rejects the entry path %j", (path) => {
      expect(() => ArchiveEntry.create(path, ObjectKey.create("a.flac"))).toThrow(InvalidArchiveEntryError);
    });

    it("rejects two entries with the same path", () => {
      const entry = ArchiveEntry.create("vocals.flac", ObjectKey.create("a.flac"));

      expect(() => ArchiveEntryList.create([entry, entry])).toThrow(InvalidArchiveEntryError);
    });
  });
});
