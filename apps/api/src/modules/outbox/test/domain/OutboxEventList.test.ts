import { describe, expect, it } from "vitest";
import { DuplicatedOutboxEventError } from "../../domain/errors/DuplicatedOutboxEventError.ts";
import { OutboxEventList } from "../../domain/OutboxEventList.ts";
import * as OutboxEventMother from "../helpers/OutboxEventMother.ts";

describe("OutboxEventList", () => {
  it("survives a primitive round-trip", () => {
    const primitive = [OutboxEventMother.createPrimitive(), OutboxEventMother.createPrimitive()];

    expect(OutboxEventList.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
  });

  it("splits published and pending events", () => {
    const published = OutboxEventMother.published();
    const pending = OutboxEventMother.pending();
    const list = OutboxEventList.create([published, pending]);

    expect(list.filterPublished().map((event) => event.getId())).toEqual([published.getId()]);
    expect(list.filterPending().map((event) => event.getId())).toEqual([pending.getId()]);
    expect(list.count()).toBe(2);
    expect(OutboxEventList.empty().isEmpty()).toBe(true);
  });

  it("compares by content", () => {
    const event = OutboxEventMother.pending();

    expect(OutboxEventList.create([event]).equals(OutboxEventList.create([event]))).toBe(true);
    expect(OutboxEventList.create([event]).equals(OutboxEventList.empty())).toBe(false);
  });

  it("rejects the same event twice", () => {
    const event = OutboxEventMother.pending();

    expect(() => OutboxEventList.create([event, event])).toThrow(DuplicatedOutboxEventError);
  });
});
