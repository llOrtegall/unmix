import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { outbox } from "../../../shared/infrastructure/outboxSchema.ts";
import { startTestDatabase, type TestDatabase } from "../../../shared/test/helpers/TestDatabase.ts";
import { DeliveryFailure } from "../../domain/DeliveryFailure.ts";
import { DrizzleOutboxRepository } from "../../infrastructure/DrizzleOutboxRepository.ts";

const LOCK_HOLD_MS = 300;

describe("DrizzleOutboxRepository", () => {
  let database: TestDatabase;
  let repository: DrizzleOutboxRepository;

  const insertEvent = async (overrides: Partial<typeof outbox.$inferInsert> = {}): Promise<string> => {
    const id = faker.string.uuid();
    await database.db.insert(outbox).values({
      id,
      eventType: "separation.requested",
      payload: { jobId: faker.string.uuid() },
      occurredAt: faker.date.recent(),
      ...overrides,
    });
    return id;
  };

  beforeAll(async () => {
    database = await startTestDatabase();
    repository = new DrizzleOutboxRepository(database.transactions);
  }, 120_000);

  afterAll(async () => {
    await database.stop();
  });

  beforeEach(async () => {
    await database.truncate();
  });

  it("finds the pending events, oldest first", async () => {
    const newer = await insertEvent({ occurredAt: new Date("2026-07-01T11:00:00Z") });
    const older = await insertEvent({ occurredAt: new Date("2026-07-01T10:00:00Z"), attempts: 2, lastError: "Redis is down" });
    await insertEvent({ publishedAt: new Date() });

    const pending = await repository.findPending();

    expect(pending.map((event) => event.getId().toPrimitive())).toEqual([older, newer]);
    expect(pending.toPrimitive()[0]).toMatchObject({ type: "separation.requested", attempts: 2, lastFailure: "Redis is down" });
  });

  it("stores the outcome of a delivery", async () => {
    await insertEvent();
    await insertEvent();
    const [published, failed] = (await repository.findPending()).map((event) => event);

    await repository.save(published!.markAsPublished());
    await repository.save(failed!.recordFailure(DeliveryFailure.create("Redis is down")));

    expect((await repository.findPending()).toPrimitive()).toEqual([
      { ...failed!.toPrimitive(), attempts: 1, lastFailure: "Redis is down" },
    ]);
  });

  it("skips the events another transaction is delivering", async () => {
    await insertEvent();
    let signalLocked!: () => void;
    const locked = new Promise<void>((resolve) => {
      signalLocked = resolve;
    });

    const first = database.transactions.run(async () => {
      await repository.findPending();
      signalLocked();
      await new Promise((resolve) => setTimeout(resolve, LOCK_HOLD_MS));
    });
    await locked;
    const second = await database.transactions.run(() => repository.findPending());
    await first;

    expect(second.isEmpty()).toBe(true);
  });
});
