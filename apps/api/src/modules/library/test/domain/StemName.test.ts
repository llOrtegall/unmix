import { describe, expect, it } from "vitest";
import { InvalidStemNameError } from "../../domain/errors/InvalidStemNameError.ts";
import { StemName } from "../../domain/StemName.ts";

describe("StemName", () => {
  it.each(["vocals", "drums", "bass", "guitar", "piano", "other"] as const)("accepts %s", (name) => {
    expect(StemName.fromPrimitive(name).equals(StemName.create(name))).toBe(true);
  });

  it("rejects an unknown stem", () => {
    expect(() => StemName.create("kazoo")).toThrow(InvalidStemNameError);
  });
});
