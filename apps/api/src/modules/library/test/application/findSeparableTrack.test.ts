import { describe, expect, it, vi } from "vitest";
import { findSeparableTrack } from "../../application/findSeparableTrack.ts";
import { TrackBusyError } from "../../domain/errors/TrackBusyError.ts";
import { UploadMissingError } from "../../domain/errors/UploadMissingError.ts";
import type { Track } from "../../domain/Track.ts";
import * as StorageRepositoryMother from "../helpers/StorageRepositoryMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

const find = (track: Track, uploaded = true) =>
  findSeparableTrack({
    trackRepository: TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) }),
    storageRepository: StorageRepositoryMother.create({ exists: vi.fn().mockResolvedValue(uploaded) }),
  })(track.toPrimitive().id, track.toPrimitive().ownerId);

describe("findSeparableTrack", () => {
  it("returns an uploaded track that is not being separated", async () => {
    const track = TrackMother.create();

    expect(await find(track)).toBe(track);
  });

  it("rejects a track whose file never arrived", async () => {
    await expect(find(TrackMother.create(), false)).rejects.toThrow(UploadMissingError);
  });

  it("rejects a track that is already being separated", async () => {
    await expect(find(TrackMother.separating())).rejects.toThrow(TrackBusyError);
  });
});
