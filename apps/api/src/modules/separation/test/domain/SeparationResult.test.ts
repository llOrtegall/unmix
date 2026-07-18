import { describe, expect, it } from "vitest";
import { InvalidSeparationResultError } from "../../domain/errors/InvalidSeparationResultError.ts";
import { SeparationResult } from "../../domain/SeparationResult.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

describe("SeparationResult", () => {
  it("survives a primitive round-trip", () => {
    const primitive = SeparationResultMother.createPrimitive();

    expect(SeparationResult.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("compares by duration and stems", () => {
    const primitive = SeparationResultMother.createPrimitive();

    expect(SeparationResult.fromPrimitive(primitive).equals(SeparationResult.fromPrimitive(primitive))).toBe(true);
    expect(SeparationResult.fromPrimitive(primitive).equals(SeparationResultMother.create())).toBe(false);
  });

  it("rejects a result without stems", () => {
    expect(() => SeparationResultMother.create({ stems: [] })).toThrow(InvalidSeparationResultError);
  });
});
