import { describe, expect, it } from "vitest";
import { DuplicatedStemError } from "../../domain/errors/DuplicatedStemError.ts";
import { StemList } from "../../domain/StemList.ts";
import * as StemMother from "../helpers/StemMother.ts";

describe("StemList", () => {
  it("survives a primitive round-trip", () => {
    const primitive = StemMother.listPrimitive();

    expect(StemList.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("counts and maps its stems", () => {
    const list = StemList.fromPrimitive(StemMother.listPrimitive(["vocals", "bass"]));

    expect(list.count()).toBe(2);
    expect(list.map((stem) => stem.getName().toPrimitive())).toEqual(["vocals", "bass"]);
    expect(StemList.empty().isEmpty()).toBe(true);
  });

  it("compares by content", () => {
    const primitive = StemMother.listPrimitive();

    expect(StemList.fromPrimitive(primitive).equals(StemList.fromPrimitive(primitive))).toBe(true);
    expect(StemList.fromPrimitive(primitive).equals(StemList.empty())).toBe(false);
  });

  it("rejects two stems with the same name", () => {
    expect(() => StemList.fromPrimitive(StemMother.listPrimitive(["vocals", "vocals"]))).toThrow(DuplicatedStemError);
  });
});
