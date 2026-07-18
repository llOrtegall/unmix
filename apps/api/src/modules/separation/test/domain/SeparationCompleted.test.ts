import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { UnexpectedEventTypeError } from "../../../shared/domain/errors/UnexpectedEventTypeError.ts";
import { SeparationCompleted, type SeparationCompletedPrimitive } from "../../domain/SeparationCompleted.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

const primitive = (overrides: Partial<SeparationCompletedPrimitive> = {}): SeparationCompletedPrimitive => ({
  id: faker.string.uuid(),
  type: SeparationCompleted.TYPE,
  occurredAt: faker.date.recent().toISOString(),
  payload: { jobId: faker.string.uuid(), trackId: faker.string.uuid(), ...SeparationResultMother.createPrimitive() },
  ...overrides,
});

describe("SeparationCompleted", () => {
  it("survives a primitive round-trip", () => {
    const data = primitive();

    expect(SeparationCompleted.fromPrimitive(data).toPrimitive()).toEqual(data);
  });

  it("rejects data of another event", () => {
    expect(() => SeparationCompleted.fromPrimitive(primitive({ type: "separation.requested" }))).toThrow(
      UnexpectedEventTypeError,
    );
  });
});
