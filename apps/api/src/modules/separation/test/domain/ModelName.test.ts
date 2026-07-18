import { describe, expect, it } from "vitest";
import { InvalidModelNameError } from "../../domain/errors/InvalidModelNameError.ts";
import { ModelName } from "../../domain/ModelName.ts";

describe("ModelName", () => {
  it("survives a primitive round-trip", () => {
    expect(ModelName.fromPrimitive("htdemucs_ft").toPrimitive()).toBe("htdemucs_ft");
  });

  it("compares by value", () => {
    expect(ModelName.create("htdemucs_6s").equals(ModelName.create("htdemucs_6s"))).toBe(true);
    expect(ModelName.create("htdemucs_6s").equals(ModelName.create("htdemucs"))).toBe(false);
  });

  it("rejects a model the worker does not run", () => {
    expect(() => ModelName.create("spleeter")).toThrow(InvalidModelNameError);
  });
});
