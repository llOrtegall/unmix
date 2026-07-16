import { describe, expect, it } from "vitest";
import { InvalidTrackTitleError } from "../../domain/errors/InvalidTrackTitleError.ts";
import { OriginalFilename } from "../../domain/OriginalFilename.ts";
import { TrackTitle } from "../../domain/TrackTitle.ts";

describe("TrackTitle", () => {
  describe("Basic behaviour", () => {
    it("trims the value", () => {
      expect(TrackTitle.create("  La  ").toPrimitive()).toBe("La");
    });

    it("comes from the filename without its extension", () => {
      expect(TrackTitle.fromFilename(OriginalFilename.create("My Song.mp3")).toPrimitive()).toBe("My Song");
    });

    it("compares by value", () => {
      expect(TrackTitle.fromPrimitive("La").equals(TrackTitle.create("La"))).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("keeps the whole filename when nothing is left without the extension", () => {
      expect(TrackTitle.fromFilename(OriginalFilename.create(".mp3")).toPrimitive()).toBe(".mp3");
    });
  });

  describe("Error scenarios", () => {
    it.each([
      ["an empty title", "  "],
      ["a title over 255 characters", "a".repeat(256)],
    ])("rejects %s", (_name, value) => {
      expect(() => TrackTitle.create(value)).toThrow(InvalidTrackTitleError);
    });
  });
});
