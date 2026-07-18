import type { DomainEvent, DomainEventPrimitive } from "../domain/DomainEvent.ts";
import type { DomainEventList } from "../domain/DomainEventList.ts";
import type { DomainEventClass, DomainEventHandler, EventRepository } from "../domain/EventRepository.ts";
import type { DrizzleTransactionRepository } from "./DrizzleTransactionRepository.ts";
import { outbox } from "./outboxSchema.ts";

// Subscribers run inside the publisher's transaction (ADR 0021): a failing reaction rolls back the whole change.
export class OutboxEventRepository implements EventRepository {
  private readonly transactions: DrizzleTransactionRepository;
  private readonly handlers = new Map<string, DomainEventHandler<DomainEvent>[]>();

  constructor(transactions: DrizzleTransactionRepository) {
    this.transactions = transactions;
  }

  subscribe<E extends DomainEvent>(eventClass: DomainEventClass<E>, handler: DomainEventHandler<E>): void {
    const handlers = this.handlers.get(eventClass.TYPE) ?? [];
    this.handlers.set(eventClass.TYPE, [...handlers, handler as DomainEventHandler<DomainEvent>]);
  }

  async publish(events: DomainEventList): Promise<void> {
    if (events.isEmpty()) return;
    await this.transactions.run(async () => {
      await this.transactions.executor().insert(outbox).values(events.toPrimitive().map((event) => this.toRow(event)));
      for (const event of events.map((event) => event)) await this.dispatch(event);
    });
  }

  private async dispatch(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers.get(event.getType()) ?? []) await handler(event);
  }

  private toRow(event: DomainEventPrimitive): typeof outbox.$inferInsert {
    return { id: event.id, eventType: event.type, payload: event.payload, occurredAt: new Date(event.occurredAt) };
  }
}
