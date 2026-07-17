import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { InvalidEventIdError } from "../../domain/errors/InvalidEventIdError.ts";
import { EventId } from "../../domain/EventId.ts";

describe("EventId", () => {
  it("survives a primitive round-trip", () => {
    const primitive = faker.string.uuid();

    expect(EventId.fromPrimitive(primitive).toPrimitive()).toBe(primitive);
  });

  it("generates distinct valid ids", () => {
    expect(EventId.generate().equals(EventId.generate())).toBe(false);
  });

  it("normalizes the case", () => {
    const primitive = faker.string.uuid();

    expect(EventId.create(primitive.toUpperCase()).equals(EventId.create(primitive))).toBe(true);
  });

  it("rejects a value that is not a UUID", () => {
    expect(() => EventId.create("event-1")).toThrow(InvalidEventIdError);
  });
});
