import { DuplicatedOutboxEventError } from "./errors/DuplicatedOutboxEventError.ts";
import { OutboxEvent, type OutboxEventPrimitive } from "./OutboxEvent.ts";

export type OutboxEventListPrimitive = readonly OutboxEventPrimitive[];

export class OutboxEventList {
  private readonly events: readonly OutboxEvent[];

  private constructor(events: readonly OutboxEvent[]) {
    this.events = events;
  }

  static create(events: readonly OutboxEvent[]): OutboxEventList {
    OutboxEventList.ensureHasNoDuplicates(events);
    return new OutboxEventList([...events]);
  }

  static empty(): OutboxEventList {
    return OutboxEventList.create([]);
  }

  static fromPrimitive(data: OutboxEventListPrimitive): OutboxEventList {
    return OutboxEventList.create(data.map(OutboxEvent.fromPrimitive));
  }

  private static ensureHasNoDuplicates(events: readonly OutboxEvent[]): void {
    const ids = events.map((event) => event.getId().toPrimitive());
    const duplicated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (duplicated) throw new DuplicatedOutboxEventError(duplicated);
  }

  filterPublished(): OutboxEventList {
    return OutboxEventList.create(this.events.filter((event) => event.isPublished()));
  }

  filterPending(): OutboxEventList {
    return OutboxEventList.create(this.events.filter((event) => !event.isPublished()));
  }

  map<T>(transform: (event: OutboxEvent) => T): T[] {
    return this.events.map(transform);
  }

  count(): number {
    return this.events.length;
  }

  isEmpty(): boolean {
    return this.events.length === 0;
  }

  equals(other: OutboxEventList): boolean {
    return this.count() === other.count() && this.events.every((event, index) => other.events[index]?.equals(event));
  }

  toPrimitive(): OutboxEventListPrimitive {
    return this.events.map((event) => event.toPrimitive());
  }
}
