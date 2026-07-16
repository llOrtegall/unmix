import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { checkTrackOwnership } from "../../application/checkTrackOwnership.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("checkTrackOwnership", () => {
  it("is true only for the owner of an existing track", async () => {
    const track = TrackMother.create();
    const trackRepository = TrackRepositoryMother.create({ findById: vi.fn().mockResolvedValue(track) });
    const check = checkTrackOwnership({ trackRepository });
    const { id, ownerId } = track.toPrimitive();

    expect(await check(id, ownerId)).toBe(true);
    expect(await check(id, faker.string.uuid())).toBe(false);
  });

  it("is false for a missing track", async () => {
    const check = checkTrackOwnership({ trackRepository: TrackRepositoryMother.create() });

    expect(await check(faker.string.uuid(), faker.string.uuid())).toBe(false);
  });
});
