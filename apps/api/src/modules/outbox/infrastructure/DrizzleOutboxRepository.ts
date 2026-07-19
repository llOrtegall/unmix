import { asc, eq, isNull } from "drizzle-orm";
import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import { outbox } from "../../shared/infrastructure/outboxSchema.ts";
import type { EventPayloadPrimitive } from "../domain/EventPayload.ts";
import type { OutboxEvent, OutboxEventPrimitive } from "../domain/OutboxEvent.ts";
import { OutboxEventList } from "../domain/OutboxEventList.ts";
import type { OutboxRepository } from "../domain/OutboxRepository.ts";

type OutboxRow = typeof outbox.$inferSelect;

export class DrizzleOutboxRepository implements OutboxRepository {
  private static readonly BATCH_SIZE = 50;

  private readonly transactions: DrizzleTransactionRepository;

  constructor(transactions: DrizzleTransactionRepository) {
    this.transactions = transactions;
  }

  async findPending(): Promise<OutboxEventList> {
    const rows = await this.transactions
      .executor()
      .select()
      .from(outbox)
      .where(isNull(outbox.publishedAt))
      .orderBy(asc(outbox.occurredAt))
      .limit(DrizzleOutboxRepository.BATCH_SIZE)
      .for("update", { skipLocked: true });
    return OutboxEventList.fromPrimitive(rows.map((row) => this.toPrimitive(row)));
  }

  async save(event: OutboxEvent): Promise<void> {
    const { id, attempts, publishedAt, lastFailure } = event.toPrimitive();
    await this.transactions
      .executor()
      .update(outbox)
      .set({ attempts, publishedAt: publishedAt === null ? null : new Date(publishedAt), lastError: lastFailure })
      .where(eq(outbox.id, id));
  }

  private toPrimitive(row: OutboxRow): OutboxEventPrimitive {
    return {
      id: row.id,
      type: row.eventType,
      payload: row.payload as EventPayloadPrimitive,
      attempts: row.attempts,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      lastFailure: row.lastError,
    };
  }
}
