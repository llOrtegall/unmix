import { describe, expect, it } from "vitest";
import { InvalidSignedUrlError } from "../../domain/errors/InvalidSignedUrlError.ts";
import { SignedUrl } from "../../domain/SignedUrl.ts";

describe("SignedUrl", () => {
  it("survives a primitive round-trip", () => {
    const url = "http://localhost:9000/unmix/tracks/a.mp3?X-Amz-Signature=abc";

    expect(SignedUrl.fromPrimitive(url).toPrimitive()).toBe(url);
    expect(SignedUrl.create(url).equals(SignedUrl.create(url))).toBe(true);
  });

  it.each(["not a url", "ftp://storage/a.mp3", ""])("rejects %j", (value) => {
    expect(() => SignedUrl.create(value)).toThrow(InvalidSignedUrlError);
  });
});
