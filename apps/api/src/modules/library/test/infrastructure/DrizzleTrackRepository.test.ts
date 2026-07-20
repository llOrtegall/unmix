import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CreatedAt } from "../../../shared/domain/CreatedAt.ts";
import { UserId } from "../../../shared/domain/UserId.ts";
import { startTestDatabase, type TestDatabase } from "../../../shared/test/helpers/TestDatabase.ts";
import { PageSize } from "../../domain/PageSize.ts";
import type { Track, TrackPrimitive } from "../../domain/Track.ts";
import { TrackIdList } from "../../domain/TrackIdList.ts";
import { DrizzleTrackRepository } from "../../infrastructure/DrizzleTrackRepository.ts";
import * as StemMother from "../helpers/StemMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";

describe("DrizzleTrackRepository", () => {
  let database: TestDatabase;
  let repository: DrizzleTrackRepository;
  let ownerId: string;

  const saveTrack = async (overrides: Partial<TrackPrimitive> = {}) => {
    const track = TrackMother.create({ ownerId, ...overrides });
    await repository.save(track);
    return track;
  };

  const ids = (tracks: Track[]) => tracks.map((track) => track.getId().toPrimitive());

  beforeAll(async () => {
    database = await startTestDatabase();
    repository = new DrizzleTrackRepository(database.transactions);
  }, 120_000);

  afterAll(async () => {
    await database.stop();
  });

  beforeEach(async () => {
    await database.truncate();
    ownerId = await database.createUser();
  });

  describe("Basic behaviour", () => {
    it("stores a track with its stems and reads it back unchanged", async () => {
      const track = TrackMother.completed({ ownerId, credit: "Music: La" });

      await repository.save(track);

      expect((await repository.findById(track.getId()))?.toPrimitive()).toEqual(track.toPrimitive());
    });

    it("replaces the stems on every save", async () => {
      const track = await saveTrack({ status: "completed", stems: StemMother.listPrimitive(["vocals", "drums"]) });
      const resaved = TrackMother.completed({ ...track.toPrimitive(), stems: StemMother.listPrimitive(["bass"]) });

      await repository.save(resaved);

      expect((await repository.findById(track.getId()))?.toPrimitive().stems).toEqual(resaved.toPrimitive().stems);
    });

    it("deletes a track together with its stems", async () => {
      const track = await saveTrack({ status: "completed", stems: StemMother.listPrimitive() });

      await repository.delete(track.getId());

      expect(await repository.findById(track.getId())).toBeNull();
    });

    it("pages the owner's tracks from newest to oldest", async () => {
      const oldest = await saveTrack({ createdAt: "2026-07-01T10:00:00.000Z" });
      const middle = await saveTrack({ createdAt: "2026-07-01T11:00:00.000Z" });
      const newest = await saveTrack({ createdAt: "2026-07-01T12:00:00.000Z" });
      await repository.save(TrackMother.create({ ownerId: await database.createUser() }));
      const owner = UserId.fromPrimitive(ownerId);

      const first = await repository.findPageByOwner(owner, null, PageSize.create(2));
      const second = await repository.findPageByOwner(owner, CreatedAt.fromPrimitive(first.toPrimitive().nextCursor!), PageSize.create(2));

      expect(first.getTracks().map((track) => track.getId().toPrimitive())).toEqual(ids([newest, middle]));
      expect(first.hasMore()).toBe(true);
      expect(second.getTracks().map((track) => track.getId().toPrimitive())).toEqual(ids([oldest]));
      expect(second.hasMore()).toBe(false);
    });

    it("finds the uploads that were never finished before a cutoff", async () => {
      const abandoned = await saveTrack({ status: "awaiting_upload", createdAt: "2026-06-01T00:00:00.000Z" });
      await saveTrack({ status: "awaiting_upload", createdAt: "2026-07-01T00:00:00.000Z" });
      await saveTrack({ status: "completed", createdAt: "2026-06-01T00:00:00.000Z", stems: StemMother.listPrimitive() });

      const found = await repository.findAwaitingUploadCreatedBefore(CreatedAt.fromPrimitive("2026-06-15T00:00:00.000Z"));

      expect(found.map((track) => track.getId().toPrimitive())).toEqual(ids([abandoned]));
    });

    it("tells which of the given ids still exist", async () => {
      const kept = await saveTrack();
      const missing = faker.string.uuid();

      const existing = await repository.findExistingIds(TrackIdList.fromPrimitive([kept.getId().toPrimitive(), missing]));

      expect(existing.toPrimitive()).toEqual([kept.getId().toPrimitive()]);
      expect((await repository.findExistingIds(TrackIdList.empty())).isEmpty()).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("finds nothing for an unknown id", async () => {
      expect(await repository.findById(TrackMother.create().getId())).toBeNull();
    });
  });
});
