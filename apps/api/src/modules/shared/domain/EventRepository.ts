import type { DomainEvent } from "./DomainEvent.ts";
import type { DomainEventList } from "./DomainEventList.ts";

export interface DomainEventClass<E extends DomainEvent> {
  readonly TYPE: string;
  readonly prototype: E;
}

export type DomainEventHandler<E extends DomainEvent> = (event: E) => Promise<void>;

export interface EventRepository {
  publish(events: DomainEventList): Promise<void>;
  subscribe<E extends DomainEvent>(eventClass: DomainEventClass<E>, handler: DomainEventHandler<E>): void;
}
