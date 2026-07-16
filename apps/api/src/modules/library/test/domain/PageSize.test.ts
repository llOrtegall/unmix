import { describe, expect, it } from "vitest";
import { InvalidPageSizeError } from "../../domain/errors/InvalidPageSizeError.ts";
import { PageSize } from "../../domain/PageSize.ts";

describe("PageSize", () => {
  it.each([1, 20, 50])("accepts %s", (size) => {
    expect(PageSize.fromPrimitive(size).equals(PageSize.create(size))).toBe(true);
  });

  it.each([0, 51, 2.5])("rejects %s", (size) => {
    expect(() => PageSize.create(size)).toThrow(InvalidPageSizeError);
  });
});
