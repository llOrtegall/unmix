import { describe, expect, it } from "vitest";
import { InvalidProgressError } from "../../domain/errors/InvalidProgressError.ts";
import { Progress } from "../../domain/Progress.ts";

describe("Progress", () => {
  it("survives a primitive round-trip", () => {
    expect(Progress.fromPrimitive(42).toPrimitive()).toBe(42);
  });

  it("goes from none to full", () => {
    expect(Progress.none().toPrimitive()).toBe(0);
    expect(Progress.full().toPrimitive()).toBe(100);
  });

  it("compares by value", () => {
    expect(Progress.create(42).equals(Progress.create(42))).toBe(true);
    expect(Progress.create(42).equals(Progress.none())).toBe(false);
  });

  it.each([-1, 101, 42.5, Number.NaN])("rejects %s", (value) => {
    expect(() => Progress.create(value)).toThrow(InvalidProgressError);
  });
});
