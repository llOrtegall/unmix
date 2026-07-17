import { describe, expect, it } from "vitest";
import { CreatedAt } from "../../../shared/domain/CreatedAt.ts";
import { TrackList } from "../../domain/TrackList.ts";
import { TrackPage } from "../../domain/TrackPage.ts";
import * as TrackMother from "../helpers/TrackMother.ts";

describe("TrackPage", () => {
  it("survives a primitive round-trip", () => {
    const primitive = { tracks: [TrackMother.createPrimitive()], nextCursor: "2026-07-01T12:00:00.000Z" };

    expect(TrackPage.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("knows whether more tracks follow", () => {
    const tracks = TrackList.create([TrackMother.create()]);

    expect(TrackPage.create(tracks, CreatedAt.now()).hasMore()).toBe(true);
    expect(TrackPage.lastPage(tracks).hasMore()).toBe(false);
    expect(TrackPage.lastPage(tracks).getTracks()).toBe(tracks);
  });

  it("compares tracks and cursor", () => {
    const tracks = TrackList.create([TrackMother.create()]);
    const cursor = CreatedAt.now();

    expect(TrackPage.create(tracks, cursor).equals(TrackPage.create(tracks, cursor))).toBe(true);
    expect(TrackPage.create(tracks, cursor).equals(TrackPage.lastPage(tracks))).toBe(false);
  });
});
