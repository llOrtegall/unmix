import { describe, expect, it } from "vitest";
import { DuplicatedTrackIdError } from "../../domain/errors/DuplicatedTrackIdError.ts";
import { TrackList } from "../../domain/TrackList.ts";
import * as TrackMother from "../helpers/TrackMother.ts";

describe("TrackList", () => {
  it("survives a primitive round-trip", () => {
    const primitive = [TrackMother.createPrimitive(), TrackMother.createPrimitive()];

    expect(TrackList.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("counts and maps its tracks", () => {
    const tracks = [TrackMother.create(), TrackMother.create()];
    const list = TrackList.create(tracks);

    expect(list.count()).toBe(2);
    expect(list.map((track) => track.getId())).toEqual(tracks.map((track) => track.getId()));
    expect(TrackList.empty().isEmpty()).toBe(true);
  });

  it("compares by content", () => {
    const tracks = [TrackMother.create()];

    expect(TrackList.create(tracks).equals(TrackList.create(tracks))).toBe(true);
    expect(TrackList.create(tracks).equals(TrackList.empty())).toBe(false);
  });

  it("rejects the same track twice", () => {
    const track = TrackMother.create();

    expect(() => TrackList.create([track, track])).toThrow(DuplicatedTrackIdError);
  });
});
