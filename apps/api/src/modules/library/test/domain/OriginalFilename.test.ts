import { describe, expect, it } from "vitest";
import { InvalidOriginalFilenameError } from "../../domain/errors/InvalidOriginalFilenameError.ts";
import { OriginalFilename } from "../../domain/OriginalFilename.ts";

describe("OriginalFilename", () => {
  it("survives a primitive round-trip", () => {
    expect(OriginalFilename.fromPrimitive("My Song.mp3").toPrimitive()).toBe("My Song.mp3");
  });

  it("drops only the last extension", () => {
    expect(OriginalFilename.create("live.at.wembley.mkv").withoutExtension()).toBe("live.at.wembley");
  });

  it("compares by value", () => {
    expect(OriginalFilename.create("a.mp3").equals(OriginalFilename.create("a.mp3"))).toBe(true);
  });

  it.each([
    ["a blank name", "   "],
    ["a name over 255 characters", `${"a".repeat(252)}.mp3`],
  ])("rejects %s", (_name, value) => {
    expect(() => OriginalFilename.create(value)).toThrow(InvalidOriginalFilenameError);
  });
});
