import type { DomainEvent } from "./domain-event.ts";

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

/**
 * Runs `work` atomically. Repositories and the event publisher called inside it
 * share the same transaction.
 */
export interface TransactionManager {
  run<T>(work: () => Promise<T>): Promise<T>;
}

/**
 * Persists events to the outbox and runs in-process handlers, inside the
 * current transaction (ADR 0014).
 */
export interface EventPublisher {
  publish(events: DomainEvent[]): Promise<void>;
}

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => Promise<void>;
