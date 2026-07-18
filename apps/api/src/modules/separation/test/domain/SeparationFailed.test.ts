import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { UnexpectedEventTypeError } from "../../../shared/domain/errors/UnexpectedEventTypeError.ts";
import { SeparationFailed, type SeparationFailedPrimitive } from "../../domain/SeparationFailed.ts";
import * as JobFailureMother from "../helpers/JobFailureMother.ts";

const primitive = (overrides: Partial<SeparationFailedPrimitive> = {}): SeparationFailedPrimitive => ({
  id: faker.string.uuid(),
  type: SeparationFailed.TYPE,
  occurredAt: faker.date.recent().toISOString(),
  payload: { jobId: faker.string.uuid(), trackId: faker.string.uuid(), ...JobFailureMother.createPrimitive() },
  ...overrides,
});

describe("SeparationFailed", () => {
  it("survives a primitive round-trip", () => {
    const data = primitive();

    expect(SeparationFailed.fromPrimitive(data).toPrimitive()).toEqual(data);
  });

  it("rejects data of another event", () => {
    expect(() => SeparationFailed.fromPrimitive(primitive({ type: "separation.completed" }))).toThrow(UnexpectedEventTypeError);
  });
});
