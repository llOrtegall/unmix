import type { OutboxEvent } from "./OutboxEvent.ts";

export interface EventRouteRepository {
  deliver(event: OutboxEvent): Promise<void>;
}
