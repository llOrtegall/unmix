import { afterEach, describe, expect, it, vi } from "vitest";
import { InvalidFinishedAtError } from "../../domain/errors/InvalidFinishedAtError.ts";
import { FinishedAt } from "../../domain/FinishedAt.ts";

describe("FinishedAt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("survives a primitive round-trip", () => {
    expect(FinishedAt.fromPrimitive("2026-07-01T12:00:00.000Z").toPrimitive()).toBe("2026-07-01T12:00:00.000Z");
  });

  it("is taken from the clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));

    expect(FinishedAt.now().equals(FinishedAt.fromPrimitive("2026-07-01T12:00:00.000Z"))).toBe(true);
  });

  it("does not change when the source date is mutated", () => {
    const source = new Date("2026-07-01T00:00:00Z");
    const finishedAt = FinishedAt.create(source);

    source.setFullYear(2000);

    expect(finishedAt.toPrimitive()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("rejects an invalid date", () => {
    expect(() => FinishedAt.fromPrimitive("soon")).toThrow(InvalidFinishedAtError);
  });
});
