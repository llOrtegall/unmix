import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { collectGarbage } from "../../application/collectGarbage.ts";
import { TrackFolderList } from "../../domain/TrackFolderList.ts";
import { TrackIdList } from "../../domain/TrackIdList.ts";
import { TrackList } from "../../domain/TrackList.ts";
import * as StorageRepositoryMother from "../helpers/StorageRepositoryMother.ts";
import * as TrackMother from "../helpers/TrackMother.ts";
import * as TrackRepositoryMother from "../helpers/TrackRepositoryMother.ts";

describe("collectGarbage", () => {
  it("drops abandoned uploads first and then the folders without a track", async () => {
    const abandoned = TrackMother.create();
    const [alive, orphan] = [faker.string.uuid(), faker.string.uuid()];
    const trackRepository = TrackRepositoryMother.create({
      findAwaitingUploadCreatedBefore: vi.fn().mockResolvedValue(TrackList.create([abandoned])),
      findExistingIds: vi.fn().mockResolvedValue(TrackIdList.fromPrimitive([alive])),
    });
    const storageRepository = StorageRepositoryMother.create({
      findTrackFolders: vi.fn().mockResolvedValue(TrackFolderList.fromPrimitive([`tracks/${alive}/`, `tracks/${orphan}/`])),
    });

    const report = await collectGarbage({ trackRepository, storageRepository })();

    expect(report).toEqual({ abandonedUploads: 1, orphanFolders: 1 });
    expect(trackRepository.delete.mock.calls[0]![0].equals(abandoned.getId())).toBe(true);
    expect(storageRepository.deleteFolder.mock.calls.map(([folder]) => folder.toPrimitive())).toEqual([`tracks/${orphan}/`]);
    expect(trackRepository.delete.mock.invocationCallOrder[0]).toBeLessThan(
      storageRepository.findTrackFolders.mock.invocationCallOrder[0]!,
    );
  });

  it("asks for uploads abandoned more than a day ago", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-02T12:00:00Z"));
    const trackRepository = TrackRepositoryMother.create();

    await collectGarbage({ trackRepository, storageRepository: StorageRepositoryMother.create() })();

    expect(trackRepository.findAwaitingUploadCreatedBefore.mock.calls[0]![0].toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
    vi.useRealTimers();
  });

  it("does nothing when there is no garbage", async () => {
    const storageRepository = StorageRepositoryMother.create();

    expect(await collectGarbage({ trackRepository: TrackRepositoryMother.create(), storageRepository })()).toEqual({
      abandonedUploads: 0,
      orphanFolders: 0,
    });
    expect(storageRepository.deleteFolder).not.toHaveBeenCalled();
  });
});
