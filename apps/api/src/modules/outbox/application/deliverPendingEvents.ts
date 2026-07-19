import type { EventRouteRepository } from "../domain/EventRouteRepository.ts";
import type { OutboxEvent } from "../domain/OutboxEvent.ts";
import { OutboxEventList } from "../domain/OutboxEventList.ts";
import type { OutboxRepository } from "../domain/OutboxRepository.ts";
import { deliverEvent } from "./deliverEvent.ts";

interface Dependencies {
  readonly outboxRepository: OutboxRepository;
  readonly eventRouteRepository: EventRouteRepository;
}

export const deliverPendingEvents = ({ outboxRepository, eventRouteRepository }: Dependencies) => {
  const deliver = deliverEvent({ eventRouteRepository });

  return async (): Promise<OutboxEventList> => {
    const pending = await outboxRepository.findPending();
    const settled: OutboxEvent[] = [];
    for (const event of pending.map((event) => event)) {
      const outcome = await deliver(event);
      await outboxRepository.save(outcome);
      settled.push(outcome);
    }
    return OutboxEventList.create(settled);
  };
};
