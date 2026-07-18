import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainEventList } from "../../domain/DomainEventList.ts";
import { OutboxEventRepository } from "../../infrastructure/OutboxEventRepository.ts";
import { outbox } from "../../infrastructure/outboxSchema.ts";
import * as DomainEventMother from "../helpers/DomainEventMother.ts";
import { SampleEvent } from "../helpers/SampleEvent.ts";
import { startTestDatabase, type TestDatabase } from "../helpers/TestDatabase.ts";

describe("OutboxEventRepository", () => {
  let database: TestDatabase;

  const storedEvents = async () =>
    (await database.db.select().from(outbox)).map(({ id, eventType, payload, occurredAt }) => ({
      id,
      type: eventType,
      payload,
      occurredAt: occurredAt.toISOString(),
    }));

  beforeAll(async () => {
    database = await startTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await database.stop();
  });

  beforeEach(async () => {
    await database.truncate();
  });

  describe("Basic behaviour", () => {
    it("writes every event to the outbox", async () => {
      const events = [DomainEventMother.create(), DomainEventMother.create()];

      await new OutboxEventRepository(database.transactions).publish(DomainEventList.create(events));

      expect(await storedEvents()).toEqual(expect.arrayContaining(events.map((event) => event.toPrimitive())));
    });

    it("hands each event to the subscribers of its class, in order", async () => {
      const repository = new OutboxEventRepository(database.transactions);
      const calls: string[] = [];
      repository.subscribe(SampleEvent, async () => {
        calls.push("first");
      });
      repository.subscribe(SampleEvent, async () => {
        calls.push("second");
      });
      const event = DomainEventMother.create();

      await repository.publish(DomainEventList.create([event]));

      expect(calls).toEqual(["first", "second"]);
    });

    it("writes nothing for an empty list", async () => {
      await new OutboxEventRepository(database.transactions).publish(DomainEventList.empty());

      expect(await storedEvents()).toEqual([]);
    });
  });

  describe("Error scenarios", () => {
    it("rolls the events back when a subscriber fails", async () => {
      const repository = new OutboxEventRepository(database.transactions);
      const handler = vi.fn().mockRejectedValue(new Error("the library refused"));
      repository.subscribe(SampleEvent, handler);
      const event = DomainEventMother.create();

      await expect(repository.publish(DomainEventList.create([event]))).rejects.toThrow("the library refused");

      expect(handler).toHaveBeenCalledWith(event);
      expect(await storedEvents()).toEqual([]);
    });
  });
});
