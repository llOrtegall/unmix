import type { DomainEvent, DomainEventPrimitive } from "./DomainEvent.ts";
import { DuplicatedEventError } from "./errors/DuplicatedEventError.ts";

export type DomainEventListPrimitive = readonly DomainEventPrimitive[];

// No fromPrimitive: events are never rehydrated as a list, each event class has its own.
export class DomainEventList {
  private readonly events: readonly DomainEvent[];

  private constructor(events: readonly DomainEvent[]) {
    this.events = events;
  }

  static create(events: readonly DomainEvent[]): DomainEventList {
    DomainEventList.ensureHasNoDuplicates(events);
    return new DomainEventList([...events]);
  }

  static empty(): DomainEventList {
    return DomainEventList.create([]);
  }

  private static ensureHasNoDuplicates(events: readonly DomainEvent[]): void {
    const ids = events.map((event) => event.getId().toPrimitive());
    const duplicated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicated) throw new DuplicatedEventError(duplicated);
  }

  add(event: DomainEvent): DomainEventList {
    return DomainEventList.create([...this.events, event]);
  }

  map<T>(transform: (event: DomainEvent) => T): T[] {
    return this.events.map(transform);
  }

  count(): number {
    return this.events.length;
  }

  isEmpty(): boolean {
    return this.events.length === 0;
  }

  equals(other: DomainEventList): boolean {
    return this.count() === other.count() && this.events.every((event, index) => other.events[index]?.equals(event));
  }

  toPrimitive(): DomainEventListPrimitive {
    return this.events.map((event) => event.toPrimitive());
  }
}
