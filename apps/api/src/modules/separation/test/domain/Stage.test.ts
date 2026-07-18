import { describe, expect, it } from "vitest";
import { InvalidStageError } from "../../domain/errors/InvalidStageError.ts";
import { Stage } from "../../domain/Stage.ts";

describe("Stage", () => {
  it("survives a primitive round-trip", () => {
    expect(Stage.fromPrimitive("normalizing").toPrimitive()).toBe("normalizing");
  });

  it("compares by value", () => {
    expect(Stage.uploading().equals(Stage.create("uploading"))).toBe(true);
    expect(Stage.uploading().equals(Stage.create("separating"))).toBe(false);
  });

  it("rejects an unknown stage", () => {
    expect(() => Stage.create("mixing")).toThrow(InvalidStageError);
  });
});
