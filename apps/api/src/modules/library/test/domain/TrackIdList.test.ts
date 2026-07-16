import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { DuplicatedTrackIdError } from "../../domain/errors/DuplicatedTrackIdError.ts";
import { TrackId } from "../../domain/TrackId.ts";
import { TrackIdList } from "../../domain/TrackIdList.ts";

describe("TrackIdList", () => {
  it("survives a primitive round-trip", () => {
    const primitive = [faker.string.uuid(), faker.string.uuid()];

    expect(TrackIdList.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("knows which ids it holds", () => {
    const id = faker.string.uuid();
    const list = TrackIdList.fromPrimitive([id]);

    expect(list.includes(TrackId.create(id))).toBe(true);
    expect(list.includes(TrackId.generate())).toBe(false);
    expect(TrackIdList.empty().isEmpty()).toBe(true);
  });

  it("compares by content and order", () => {
    const ids = [faker.string.uuid(), faker.string.uuid()];

    expect(TrackIdList.fromPrimitive(ids).equals(TrackIdList.fromPrimitive(ids))).toBe(true);
    expect(TrackIdList.fromPrimitive(ids).equals(TrackIdList.fromPrimitive([...ids].reverse()))).toBe(false);
  });

  it("rejects duplicated ids", () => {
    const id = faker.string.uuid();

    expect(() => TrackIdList.fromPrimitive([id, id])).toThrow(DuplicatedTrackIdError);
  });
});
