import { describe, expect, it } from "vitest";
import { UnsupportedMediaTypeError } from "../../domain/errors/UnsupportedMediaTypeError.ts";
import { MediaType } from "../../domain/MediaType.ts";

describe("MediaType", () => {
  it("normalizes case and drops parameters", () => {
    expect(MediaType.create("Audio/MPEG; charset=binary").toPrimitive()).toBe("audio/mpeg");
  });

  it.each([
    ["audio/mpeg", ".mp3"],
    ["audio/x-m4a", ".m4a"],
    ["video/x-matroska", ".mkv"],
  ])("maps %s to the %s extension", (contentType, extension) => {
    expect(MediaType.fromPrimitive(contentType as "audio/mpeg").getExtension()).toBe(extension);
  });

  it("compares by value", () => {
    expect(MediaType.create("audio/wav").equals(MediaType.create("AUDIO/WAV"))).toBe(true);
  });

  it.each(["application/x-msdownload", "", "toString"])("rejects the unsupported type %j", (contentType) => {
    expect(() => MediaType.create(contentType)).toThrow(UnsupportedMediaTypeError);
  });
});
