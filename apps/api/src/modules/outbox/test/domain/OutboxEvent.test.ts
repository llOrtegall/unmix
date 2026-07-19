import { afterEach, describe, expect, it, vi } from "vitest";
import { DeliveryFailure } from "../../domain/DeliveryFailure.ts";
import { OutboxEvent } from "../../domain/OutboxEvent.ts";
import * as OutboxEventMother from "../helpers/OutboxEventMother.ts";

describe("OutboxEvent", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic behaviour", () => {
    it("survives a primitive round-trip", () => {
      const primitive = OutboxEventMother.failedBefore().toPrimitive();

      expect(OutboxEvent.fromPrimitive(primitive).toPrimitive()).toEqual(primitive);
    });

    it("is published at the current time and leaves the original pending", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
      const event = OutboxEventMother.pending();

      const published = event.markAsPublished();

      expect(published.isPublished()).toBe(true);
      expect(published.toPrimitive()).toMatchObject({ publishedAt: "2026-07-01T12:00:00.000Z", attempts: 0 });
      expect(event.isPublished()).toBe(false);
    });

    it("counts a failed delivery and keeps its reason", () => {
      const event = OutboxEventMother.failedBefore({ attempts: 2 });

      const failed = event.recordFailure(DeliveryFailure.create("Redis is down"));

      expect(failed.toPrimitive()).toMatchObject({ attempts: 3, lastFailure: "Redis is down", publishedAt: null });
    });

    it("compares by id", () => {
      const event = OutboxEventMother.pending();

      expect(event.equals(event.markAsPublished())).toBe(true);
      expect(event.equals(OutboxEventMother.pending())).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("keeps the first publication date", () => {
      const event = OutboxEventMother.published();

      expect(event.markAsPublished()).toBe(event);
    });
  });
});
