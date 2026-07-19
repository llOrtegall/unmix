import type { OutboxEvent } from "./OutboxEvent.ts";
import type { OutboxEventList } from "./OutboxEventList.ts";

export interface OutboxRepository {
  findPending(): Promise<OutboxEventList>;
  save(event: OutboxEvent): Promise<void>;
}
