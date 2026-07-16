import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { ObjectKey } from "../../../shared/domain/ObjectKey.ts";
import { DuplicatedTrackIdError } from "../../domain/errors/DuplicatedTrackIdError.ts";
import { TrackFolderList } from "../../domain/TrackFolderList.ts";
import { TrackIdList } from "../../domain/TrackIdList.ts";

describe("TrackFolderList", () => {
  it("keeps only folders named like track ids", () => {
    const id = faker.string.uuid();
    const keys = [`tracks/${id}/`, "tracks/not-a-track/", "demo/"].map(ObjectKey.create);

    expect(TrackFolderList.fromKeys(keys).toPrimitive()).toEqual([`tracks/${id}/`]);
  });

  it("drops the folders of tracks that still exist", () => {
    const [alive, orphan] = [faker.string.uuid(), faker.string.uuid()];
    const folders = TrackFolderList.fromPrimitive([`tracks/${alive}/`, `tracks/${orphan}/`]);

    const orphans = folders.excluding(TrackIdList.fromPrimitive([alive]));

    expect(orphans.getTrackIds().toPrimitive()).toEqual([orphan]);
    expect(orphans.count()).toBe(1);
    expect(folders.count()).toBe(2);
  });

  it("compares by content", () => {
    const primitive = [`tracks/${faker.string.uuid()}/`];

    expect(TrackFolderList.fromPrimitive(primitive).equals(TrackFolderList.fromPrimitive(primitive))).toBe(true);
    expect(TrackFolderList.empty().equals(TrackFolderList.fromPrimitive(primitive))).toBe(false);
  });

  it("rejects the same folder twice", () => {
    const folder = `tracks/${faker.string.uuid()}/`;

    expect(() => TrackFolderList.fromPrimitive([folder, folder])).toThrow(DuplicatedTrackIdError);
  });
});
