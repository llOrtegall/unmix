import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { InvalidSignedUrlError } from "../../domain/errors/InvalidSignedUrlError.ts";
import { UploadTicket } from "../../domain/UploadTicket.ts";

const primitive = () => ({
  trackId: faker.string.uuid(),
  uploadUrl: "https://storage.test/tracks/a.mp3?signature=abc",
  expiresInSeconds: 900,
});

describe("UploadTicket", () => {
  it("survives a primitive round-trip", () => {
    const data = primitive();

    expect(UploadTicket.fromPrimitive(data).toPrimitive()).toEqual(data);
    expect(UploadTicket.fromPrimitive(data).equals(UploadTicket.fromPrimitive(data))).toBe(true);
  });

  it("rejects an upload URL that is not HTTP", () => {
    expect(() => UploadTicket.fromPrimitive({ ...primitive(), uploadUrl: "file:///etc/passwd" })).toThrow(
      InvalidSignedUrlError,
    );
  });
});
