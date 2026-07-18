import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { UnexpectedEventTypeError } from "../../../shared/domain/errors/UnexpectedEventTypeError.ts";
import { SeparationRequested, type SeparationRequestedPrimitive } from "../../domain/SeparationRequested.ts";

const primitive = (overrides: Partial<SeparationRequestedPrimitive> = {}): SeparationRequestedPrimitive => {
  const trackId = faker.string.uuid();
  return {
    id: faker.string.uuid(),
    type: SeparationRequested.TYPE,
    occurredAt: faker.date.recent().toISOString(),
    payload: {
      jobId: faker.string.uuid(),
      trackId,
      inputKey: `tracks/${trackId}/original.mp3`,
      outputPrefix: `tracks/${trackId}/stems`,
      model: "htdemucs_6s",
    },
    ...overrides,
  };
};

describe("SeparationRequested", () => {
  it("survives a primitive round-trip", () => {
    const data = primitive();

    expect(SeparationRequested.fromPrimitive(data).toPrimitive()).toEqual(data);
  });

  it("rejects data of another event", () => {
    expect(() => SeparationRequested.fromPrimitive(primitive({ type: "separation.failed" }))).toThrow(UnexpectedEventTypeError);
  });
});
