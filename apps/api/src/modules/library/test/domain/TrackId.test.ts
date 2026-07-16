import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { InvalidTrackIdError } from "../../domain/errors/InvalidTrackIdError.ts";
import { TrackId } from "../../domain/TrackId.ts";

describe("TrackId", () => {
  it("survives a primitive round-trip", () => {
    const primitive = faker.string.uuid();

    expect(TrackId.fromPrimitive(primitive).toPrimitive()).toBe(primitive);
  });

  it("generates distinct valid ids", () => {
    expect(TrackId.generate().equals(TrackId.generate())).toBe(false);
  });

  it("rejects a value that is not a UUID", () => {
    expect(() => TrackId.create("t1")).toThrow(InvalidTrackIdError);
  });
});
