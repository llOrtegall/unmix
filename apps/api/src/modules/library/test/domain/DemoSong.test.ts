import { describe, expect, it } from "vitest";
import { DemoSong } from "../../domain/DemoSong.ts";
import { InvalidDemoSongError } from "../../domain/errors/InvalidDemoSongError.ts";
import { UnsupportedMediaTypeError } from "../../domain/errors/UnsupportedMediaTypeError.ts";
import * as DemoSongMother from "../helpers/DemoSongMother.ts";

describe("DemoSong", () => {
  it("survives a primitive round-trip", () => {
    const primitive = DemoSongMother.createPrimitive();

    expect(DemoSong.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("compares by value", () => {
    const primitive = DemoSongMother.createPrimitive();

    expect(DemoSong.fromPrimitive(primitive).equals(DemoSong.fromPrimitive(primitive))).toBe(true);
    expect(DemoSong.fromPrimitive(primitive).equals(DemoSongMother.create())).toBe(false);
  });

  it("rejects a manifest without stems", () => {
    expect(() => DemoSongMother.create({ stems: [] })).toThrow(InvalidDemoSongError);
  });

  it("rejects a manifest with an unsupported type", () => {
    expect(() => DemoSongMother.create({ contentType: "text/plain" as "audio/mpeg" })).toThrow(UnsupportedMediaTypeError);
  });
});
