import { describe, expect, it } from "vitest";
import { InvalidEventTypeError } from "../../domain/errors/InvalidEventTypeError.ts";
import { EventType } from "../../domain/EventType.ts";

describe("EventType", () => {
  it("survives a primitive round-trip", () => {
    expect(EventType.fromPrimitive("separation.requested").toPrimitive()).toBe("separation.requested");
  });

  it("compares by value", () => {
    expect(EventType.create("separation.failed").equals(EventType.create("separation.failed"))).toBe(true);
    expect(EventType.create("separation.failed").equals(EventType.create("separation.completed"))).toBe(false);
  });

  it.each(["", "separation", "Separation.Requested", "separation..requested"])("rejects %j", (value) => {
    expect(() => EventType.create(value)).toThrow(InvalidEventTypeError);
  });
});
