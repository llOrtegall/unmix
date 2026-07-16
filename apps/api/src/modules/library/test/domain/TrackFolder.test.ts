import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { ObjectKey } from "../../../shared/domain/ObjectKey.ts";
import { InvalidTrackFolderError } from "../../domain/errors/InvalidTrackFolderError.ts";
import { TrackFolder } from "../../domain/TrackFolder.ts";
import { TrackId } from "../../domain/TrackId.ts";

describe("TrackFolder", () => {
  it("lives under tracks/ and survives a primitive round-trip", () => {
    const id = faker.string.uuid();

    expect(TrackFolder.create(TrackId.create(id)).toPrimitive()).toBe(`tracks/${id}/`);
    expect(TrackFolder.fromPrimitive(`tracks/${id}/`).getTrackId().toPrimitive()).toBe(id);
  });

  it("builds keys inside the folder", () => {
    const folder = TrackFolder.create(TrackId.generate());

    expect(folder.child("original.mp3").toPrimitive()).toBe(`${folder.toPrimitive()}original.mp3`);
    expect(folder.equals(TrackFolder.create(folder.getTrackId()))).toBe(true);
  });

  it.each([
    [`tracks/${"0".repeat(8)}-0000-4000-8000-${"0".repeat(12)}/`, true],
    ["tracks/not-a-track/", false],
    ["demo/", false],
    [`tracks/${"0".repeat(8)}-0000-4000-8000-${"0".repeat(12)}/stems/`, false],
  ])("recognizes %s as a track folder: %s", (key, expected) => {
    expect(TrackFolder.isTrackFolder(ObjectKey.create(key))).toBe(expected);
  });

  it("rejects a key that is not a track folder", () => {
    expect(() => TrackFolder.fromPrimitive("tracks/not-a-track/")).toThrow(InvalidTrackFolderError);
  });
});
