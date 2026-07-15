import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { InvalidJobIdError } from "../../domain/errors/InvalidJobIdError.ts";
import { JobId } from "../../domain/JobId.ts";

describe("JobId", () => {
  it("survives a primitive round-trip", () => {
    const primitive = faker.string.uuid();

    expect(JobId.fromPrimitive(primitive).toPrimitive()).toBe(primitive);
  });

  it("generates distinct valid ids", () => {
    expect(JobId.generate().equals(JobId.generate())).toBe(false);
  });

  it("rejects a value that is not a UUID", () => {
    expect(() => JobId.create("job-1")).toThrow(InvalidJobIdError);
  });
});
