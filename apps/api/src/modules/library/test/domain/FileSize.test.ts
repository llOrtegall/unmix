import { describe, expect, it } from "vitest";
import { InvalidFileSizeError } from "../../domain/errors/InvalidFileSizeError.ts";
import { FileSize } from "../../domain/FileSize.ts";

describe("FileSize", () => {
  it("survives a primitive round-trip", () => {
    expect(FileSize.fromPrimitive(1234).toPrimitive()).toBe(1234);
  });

  it("compares sizes", () => {
    expect(FileSize.create(2).isLargerThan(FileSize.create(1))).toBe(true);
    expect(FileSize.create(1).isLargerThan(FileSize.create(1))).toBe(false);
    expect(FileSize.create(1).equals(FileSize.create(1))).toBe(true);
  });

  it("rounds to whole megabytes", () => {
    expect(FileSize.create(200 * 1_048_576).toMegabytes()).toBe(200);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects %s bytes", (bytes) => {
    expect(() => FileSize.create(bytes)).toThrow(InvalidFileSizeError);
  });
});
