import { asc, isNull, sql } from "drizzle-orm";
import type { FastifyBaseLogger } from "fastify";
import type { DomainEvent } from "../../../shared/kernel/domain-event.ts";
import type { EventHandler, EventPublisher } from "../../../shared/kernel/ports.ts";
import type { DrizzleTransactionRepository } from "./DrizzleTransactionRepository.ts";
import { outbox } from "./outboxSchema.ts";


/** Writes events to the outbox and runs in-process handlers in the same transaction. */
export class OutboxEventPublisher implements EventPublisher {
  #tx: DrizzleTransactionRepository;
  #handlers = new Map<string, EventHandler[]>();

  constructor(tx: DrizzleTransactionRepository) {
    this.#tx = tx;
  }

  on<E extends DomainEvent>(type: E["type"], handler: EventHandler<E>): void {
    const list = this.#handlers.get(type) ?? [];
    list.push(handler as EventHandler);
    this.#handlers.set(type, list);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;
    await this.#tx.executor().insert(outbox).values(
      events.map((e) => ({ id: e.id, eventType: e.type, payload: e.payload, occurredAt: e.occurredAt })),
    );
    for (const event of events) {
      for (const handler of this.#handlers.get(event.type) ?? []) await handler(event);
    }
  }
}

export type OutboxRoute = (event: { id: string; type: string; payload: unknown }) => Promise<void>;

/**
 * Publishes pending outbox rows to external systems (at-least-once).
 * Events without a route are only marked as published.
 */
export class OutboxRelay {
  #tx: DrizzleTransactionRepository;
  #routes: Map<string, OutboxRoute>;
  #log: FastifyBaseLogger;
  #timer: NodeJS.Timeout | null = null;
  #running = false;

  constructor(deps: { tx: DrizzleTransactionRepository; routes: Map<string, OutboxRoute>; log: FastifyBaseLogger }) {
    this.#tx = deps.tx;
    this.#routes = deps.routes;
    this.#log = deps.log;
  }

  start(intervalMs = 500): void {
    this.#timer = setInterval(() => void this.drain(), intervalMs);
  }

  stop(): void {
    if (this.#timer) clearInterval(this.#timer);
  }

  async drain(): Promise<number> {
    if (this.#running) return 0;
    this.#running = true;
    try {
      return await this.#tx.run(async () => {
        const db = this.#tx.executor();
        const rows = await db
          .select()
          .from(outbox)
          .where(isNull(outbox.publishedAt))
          .orderBy(asc(outbox.occurredAt))
          .limit(50)
          .for("update", { skipLocked: true });
        for (const row of rows) {
          try {
            await this.#routes.get(row.eventType)?.({ id: row.id, type: row.eventType, payload: row.payload });
            await db.update(outbox).set({ publishedAt: new Date() }).where(sql`${outbox.id} = ${row.id}`);
          } catch (error) {
            this.#log.error({ err: error, eventId: row.id }, "outbox publish failed");
            await db
              .update(outbox)
              .set({ attempts: sql`${outbox.attempts} + 1`, lastError: String(error) })
              .where(sql`${outbox.id} = ${row.id}`);
          }
        }
        return rows.length;
      });
    } finally {
      this.#running = false;
    }
  }
}
