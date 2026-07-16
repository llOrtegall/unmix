import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { findOwnedTrack } from "../../application/findOwnedTrack.ts";
import { TrackNotFoundError } from "../../domain/errors/TrackNotFoundError.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("findOwnedTrack", () => {
  it("returns a track that belongs to the user", async () => {
    const track = TrackMother.create();
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const { id, ownerId } = track.toPrimitive();

    expect(await findOwnedTrack({ trackRepository })(id, ownerId)).toBe(track);
  });

  it("treats someone else's track as missing", async () => {
    const track = TrackMother.create();
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });

    await expect(findOwnedTrack({ trackRepository })(track.toPrimitive().id, faker.string.uuid())).rejects.toThrow(
      TrackNotFoundError,
    );
  });

  it("rejects a track that does not exist", async () => {
    const trackRepository = TrackRepositoryMother.create();

    await expect(findOwnedTrack({ trackRepository })(faker.string.uuid(), faker.string.uuid())).rejects.toThrow(
      TrackNotFoundError,
    );
  });
});
