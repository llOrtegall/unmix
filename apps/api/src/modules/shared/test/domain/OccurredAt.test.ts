import { afterEach, describe, expect, it, vi } from "vitest";
import { InvalidOccurredAtError } from "../../domain/errors/InvalidOccurredAtError.ts";
import { OccurredAt } from "../../domain/OccurredAt.ts";

describe("OccurredAt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("survives a primitive round-trip", () => {
    expect(OccurredAt.fromPrimitive("2026-07-01T12:00:00.000Z").toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("is taken from the clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(OccurredAt.now().equals(OccurredAt.fromPrimitive("2026-07-01T12:00:00.000Z"))).toBe(true);
  });

  it("does not change when the source date is mutated", () => {
    const source = new Date("2026-07-01T00:00:00Z");
    const occurredAt = OccurredAt.create(source);

    source.setFullYear(2000);

    expect(occurredAt.toPrimitive()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rejects an invalid date", () => {
    expect(() => OccurredAt.fromPrimitive("yesterday")).toThrow(InvalidOccurredAtError);
  });
});
