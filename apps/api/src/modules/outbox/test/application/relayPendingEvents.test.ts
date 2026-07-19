import { describe, expect, it, vi } from "vitest";
import * as TransactionRepositoryMother from "../../../shared/test/helpers/TransactionRepositoryMother.ts";
import { relayPendingEvents } from "../../application/relayPendingEvents.ts";
import type { OutboxEvent } from "../../domain/OutboxEvent.ts";
import { OutboxEventList } from "../../domain/OutboxEventList.ts";
import * as EventRouteRepositoryMother from "../helpers/EventRouteRepositoryMother.ts";
import * as OutboxEventMother from "../helpers/OutboxEventMother.ts";
import * as OutboxRepositoryMother from "../helpers/OutboxRepositoryMother.ts";

describe("relayPendingEvents", () => {
  describe("Basic behaviour", () => {
    it("delivers every pending event and marks it as published in one transaction", async () => {
      const events = [OutboxEventMother.pending(), OutboxEventMother.failedBefore()];
      const outboxRepository = OutboxRepositoryMother.create({ findPending: vi.fn().mockResolvedValue(OutboxEventList.create(events)) });
      const eventRouteRepository = EventRouteRepositoryMother.create();
      const transactionRepository = TransactionRepositoryMother.create();

      const settled = await relayPendingEvents({ outboxRepository, eventRouteRepository, transactionRepository })();

      expect(eventRouteRepository.deliver.mock.calls.map(([event]) => event)).toEqual(events);
      expect(settled.filterPublished().count()).toBe(2);
      expect(outboxRepository.save.mock.calls.map(([event]) => event.isPublished())).toEqual([true, true]);
      expect(transactionRepository.run).toHaveBeenCalledOnce();
    });

    it("does nothing when the outbox is empty", async () => {
      const eventRouteRepository = EventRouteRepositoryMother.create();

      const settled = await relayPendingEvents({
        outboxRepository: OutboxRepositoryMother.create(),
        eventRouteRepository,
        transactionRepository: TransactionRepositoryMother.create(),
      })();

      expect(settled.isEmpty()).toBe(true);
      expect(eventRouteRepository.deliver).not.toHaveBeenCalled();
    });
  });

  describe("Error scenarios", () => {
    it("records a failed delivery and carries on with the rest", async () => {
      const failing = OutboxEventMother.pending();
      const healthy = OutboxEventMother.pending();
      const outboxRepository = OutboxRepositoryMother.create({
        findPending: vi.fn().mockResolvedValue(OutboxEventList.create([failing, healthy])),
      });
      const eventRouteRepository = EventRouteRepositoryMother.create({
        deliver: vi.fn(async (event: OutboxEvent) => {
          if (event.equals(failing)) throw new Error("Redis is down");
        }),
      });

      const settled = await relayPendingEvents({
        outboxRepository,
        eventRouteRepository,
        transactionRepository: TransactionRepositoryMother.create(),
      })();

      expect(settled.filterPending().toPrimitive()).toEqual([
        { ...failing.toPrimitive(), attempts: 1, lastFailure: "Error: Redis is down" },
      ]);
      expect(settled.filterPublished().map((event) => event.getId())).toEqual([healthy.getId()]);
      expect(outboxRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});
