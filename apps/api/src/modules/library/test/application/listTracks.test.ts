import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { listTracks } from "../../application/listTracks.ts";
import { InvalidPageSizeError } from "../../domain/errors/InvalidPageSizeError.ts";
import { TrackList } from "../../domain/TrackList.ts";
import { TrackPage } from "../../domain/TrackPage.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("listTracks", () => {
  it("returns the owner's page starting before the cursor", async () => {
    const page = TrackPage.lastPage(TrackList.create([TrackMother.create()]));
    const trackRepository = TrackRepositoryMother.create({ findPageByOwner: vi.fn().mockResolvedValue(page) });
    const ownerId = faker.string.uuid();

    const result = await listTracks({ trackRepository })({ ownerId, cursor: "2026-07-01T12:00:00.000Z", limit: 20 });

    expect(result).toBe(page);
    const [owner, before, size] = trackRepository.findPageByOwner.mock.calls[0]!;
    expect([owner.toPrimitive(), before?.toPrimitive(), size.toPrimitive()]).toEqual([ownerId, "2026-07-01T12:00:00.000Z", 20]);
  });

  it("starts from the newest track without a cursor", async () => {
    const trackRepository = TrackRepositoryMother.create();

    await listTracks({ trackRepository })({ ownerId: faker.string.uuid(), cursor: null, limit: 20 });

    expect(trackRepository.findPageByOwner.mock.calls[0]![1]).toBeNull();
  });

  it("rejects a page size out of range", async () => {
    const trackRepository = TrackRepositoryMother.create();

    await expect(listTracks({ trackRepository })({ ownerId: faker.string.uuid(), cursor: null, limit: 500 })).rejects.toThrow(
      InvalidPageSizeError,
    );
  });
});
