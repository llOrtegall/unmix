import { describe, expect, it } from "vitest";
import { InvalidUrlLifetimeError } from "../../domain/errors/InvalidUrlLifetimeError.ts";
import { UrlLifetime } from "../../domain/UrlLifetime.ts";

describe("UrlLifetime", () => {
  it("gives uploads 15 minutes and downloads an hour", () => {
    expect(UrlLifetime.forUpload().toPrimitive()).toBe(900);
    expect(UrlLifetime.forDownload().equals(UrlLifetime.fromPrimitive(3600))).toBe(true);
  });

  it.each([0, -60, 1.5])("rejects %s seconds", (seconds) => {
    expect(() => UrlLifetime.create(seconds)).toThrow(InvalidUrlLifetimeError);
  });
});
