import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreatedAt } from "../../domain/CreatedAt.ts";
import { InvalidCreatedAtError } from "../../domain/errors/InvalidCreatedAtError.ts";

describe("CreatedAt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("survives a primitive round-trip", () => {
    expect(CreatedAt.fromPrimitive("2026-07-01T12:00:00.000Z").toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("is taken from the clock", () => {
    expect(CreatedAt.now().toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
    expect(CreatedAt.hoursAgo(24).toPrimitive()).toBe("2026-06-30T12:00:00.000Z");
  });

  it("orders dates", () => {
    expect(CreatedAt.hoursAgo(1).isBefore(CreatedAt.now())).toBe(true);
    expect(CreatedAt.now().isBefore(CreatedAt.now())).toBe(false);
    expect(CreatedAt.now().equals(CreatedAt.now())).toBe(true);
  });

  it("does not change when the source date is mutated", () => {
    const source = new Date("2026-07-01T00:00:00Z");
    const createdAt = CreatedAt.create(source);

    source.setFullYear(2000);

    expect(createdAt.toPrimitive()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rejects an invalid date", () => {
    expect(() => CreatedAt.fromPrimitive("yesterday")).toThrow(InvalidCreatedAtError);
  });
});
