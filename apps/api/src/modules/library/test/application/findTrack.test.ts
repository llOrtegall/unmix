import { describe, expect, it, vi } from "vitest";
import { findTrack } from "../../application/findTrack.ts";
import * as StemMother from "../helpers/StemMother.ts";
import * as StorageRepositoryMother from "../helpers/StorageRepositoryMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("findTrack", () => {
  it("signs every file of every stem, naming downloads after the track", async () => {
    const vocals = StemMother.createPrimitive({ name: "vocals" });
    const drums = StemMother.createPrimitive({ name: "drums", midiKey: null });
    const track = TrackMother.completed({ title: "La", stems: [vocals, drums] });
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const storageRepository = StorageRepositoryMother.create();
    const { id, ownerId } = track.toPrimitive();

    const playable = (await findTrack({ trackRepository, storageRepository })(id, ownerId)).toPrimitive();

    expect(playable.stems.map((stem) => [stem.stem.name, stem.downloadUrl.includes(stem.stem.key), stem.midiUrl !== null])).toEqual([
      ["vocals", true, true],
      ["drums", true, false],
    ]);
    const filenames = storageRepository.signDownload.mock.calls.map(([, , filename]) => filename).filter(Boolean);
    expect(filenames).toEqual(["La - vocals.flac", "La - vocals.mid", "La - drums.flac"]);
  });

  it("returns a track without stems before it is separated", async () => {
    const track = TrackMother.create();
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const storageRepository = StorageRepositoryMother.create();
    const { id, ownerId } = track.toPrimitive();

    const playable = await findTrack({ trackRepository, storageRepository })(id, ownerId);

    expect(playable.toPrimitive().stems).toEqual([]);
    expect(storageRepository.signDownload).not.toHaveBeenCalled();
  });
});
