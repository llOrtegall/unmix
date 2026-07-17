import { describe, expect, it } from "vitest";
import { UnexpectedEventTypeError } from "../../domain/errors/UnexpectedEventTypeError.ts";
import * as DomainEventMother from "../helpers/DomainEventMother.ts";
import { SampleEvent } from "../helpers/SampleEvent.ts";

describe("DomainEvent", () => {
  it("serializes its id, type, date and payload", () => {
    const primitive = DomainEventMother.createPrimitive();

    expect(SampleEvent.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("exposes its type", () => {
    expect(DomainEventMother.create().getType()).toBe(SampleEvent.TYPE);
  });

  it("compares by id", () => {
    const primitive = DomainEventMother.createPrimitive();

    expect(SampleEvent.fromPrimitive(primitive).equals(DomainEventMother.create({ id: primitive.id }))).toBe(true);
    expect(SampleEvent.fromPrimitive(primitive).equals(DomainEventMother.create())).toBe(false);
  });

  it("rejects data of another event type", () => {
    expect(() => SampleEvent.fromPrimitive(DomainEventMother.createPrimitive({ type: "other.happened" }))).toThrow(
      UnexpectedEventTypeError,
    );
  });
});
