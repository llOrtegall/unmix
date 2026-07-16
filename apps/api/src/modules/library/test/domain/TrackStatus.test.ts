import { describe, expect, it } from "vitest";
import { InvalidTrackStatusError } from "../../domain/errors/InvalidTrackStatusError.ts";
import { TrackStatus } from "../../domain/TrackStatus.ts";

describe("TrackStatus", () => {
  it.each([
    ["awaiting_upload", true],
    ["uploaded", true],
    ["failed", true],
    ["separating", false],
    ["completed", false],
  ] as const)("%s allows a new separation: %s", (status, allowed) => {
    expect(TrackStatus.fromPrimitive(status).allowsNewSeparation()).toBe(allowed);
  });

  it("names each state", () => {
    expect(TrackStatus.awaitingUpload().toPrimitive()).toBe("awaiting_upload");
    expect(TrackStatus.separating().isSeparating()).toBe(true);
    expect(TrackStatus.completed().isCompleted()).toBe(true);
    expect(TrackStatus.failed().equals(TrackStatus.create("failed"))).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(() => TrackStatus.create("paused")).toThrow(InvalidTrackStatusError);
  });
});
