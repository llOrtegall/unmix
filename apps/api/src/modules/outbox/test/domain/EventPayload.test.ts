import { describe, expect, it } from "vitest";
import { InvalidEventPayloadError } from "../../domain/errors/InvalidEventPayloadError.ts";
import { EventPayload } from "../../domain/EventPayload.ts";

describe("EventPayload", () => {
  it("survives a primitive round-trip", () => {
    const primitive = { jobId: "j", stems: [{ name: "vocals" }] };

    expect(EventPayload.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("does not change when the source or the output is mutated", () => {
    const source: Record<string, unknown> = { nested: { value: 1 } };
    const payload = EventPayload.create(source);

    (source.nested as { value: number }).value = 2;
    (payload.toPrimitive().nested as { value: number }).value = 3;

    expect(payload.toPrimitive()).toEqual({ nested: { value: 1 } });
  });

  it("compares by content", () => {
    expect(EventPayload.create({ a: 1 }).equals(EventPayload.create({ a: 1 }))).toBe(true);
    expect(EventPayload.create({ a: 1 }).equals(EventPayload.create({ a: 2 }))).toBe(false);
  });

  it.each([null, "text", 42, ["a"]])("rejects %j", (value) => {
    expect(() => EventPayload.create(value)).toThrow(InvalidEventPayloadError);
  });
});
