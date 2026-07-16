import { describe, expect, it } from "vitest";
import { InvalidTrackDurationError } from "../../domain/errors/InvalidTrackDurationError.ts";
import { TrackDuration } from "../../domain/TrackDuration.ts";

describe("TrackDuration", () => {
  it("survives a primitive round-trip", () => {
    expect(TrackDuration.fromPrimitive(297.3).toPrimitive()).toBe(297.3);
    expect(TrackDuration.create(0).equals(TrackDuration.create(0))).toBe(true);
  });

  it.each([-1, Number.POSITIVE_INFINITY, Number.NaN])("rejects %s seconds", (seconds) => {
    expect(() => TrackDuration.create(seconds)).toThrow(InvalidTrackDurationError);
  });
});
