import { describe, expect, it } from "vitest";
import { DomainEventList } from "../../domain/DomainEventList.ts";
import { DuplicatedEventError } from "../../domain/errors/DuplicatedEventError.ts";
import * as DomainEventMother from "../helpers/DomainEventMother.ts";

describe("DomainEventList", () => {
  describe("Basic behaviour", () => {
    it("starts empty", () => {
      expect(DomainEventList.empty().isEmpty()).toBe(true);
    });

    it("returns a new list when an event is added and leaves the original untouched", () => {
      const original = DomainEventList.empty();
      const event = DomainEventMother.create();

      const added = original.add(event);

      expect(added.count()).toBe(1);
      expect(added.map((item) => item.getId())).toEqual([event.getId()]);
      expect(original.isEmpty()).toBe(true);
    });

    it("serializes its events in order", () => {
      const first = DomainEventMother.create();
      const second = DomainEventMother.create();

      expect(DomainEventList.create([first, second]).toPrimitive()).toEqual([first.toPrimitive(), second.toPrimitive()]);
    });

    it("compares by content", () => {
      const event = DomainEventMother.create();

      expect(DomainEventList.create([event]).equals(DomainEventList.empty().add(event))).toBe(true);
      expect(DomainEventList.create([event]).equals(DomainEventList.empty())).toBe(false);
    });
  });

  describe("Error scenarios", () => {
    it("rejects the same event twice", () => {
      const event = DomainEventMother.create();

      expect(() => DomainEventList.create([event]).add(event)).toThrow(DuplicatedEventError);
    });
  });
});
