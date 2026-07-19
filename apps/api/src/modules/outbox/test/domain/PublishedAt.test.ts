import { afterEach, describe, expect, it, vi } from "vitest";
import { InvalidPublishedAtError } from "../../domain/errors/InvalidPublishedAtError.ts";
import { PublishedAt } from "../../domain/PublishedAt.ts";

describe("PublishedAt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("survives a primitive round-trip", () => {
    expect(PublishedAt.fromPrimitive("2026-07-01T12:00:00.000Z").toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("is taken from the clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(PublishedAt.now().equals(PublishedAt.fromPrimitive("2026-07-01T12:00:00.000Z"))).toBe(true);
  });

  it("does not change when the source date is mutated", () => {
    const source = new Date("2026-07-01T00:00:00Z");
    const publishedAt = PublishedAt.create(source);

    source.setFullYear(2000);

    expect(publishedAt.toPrimitive()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rejects an invalid date", () => {
    expect(() => PublishedAt.fromPrimitive("later")).toThrow(InvalidPublishedAtError);
  });
});
