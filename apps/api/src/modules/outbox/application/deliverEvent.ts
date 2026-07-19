import { DeliveryFailure } from "../domain/DeliveryFailure.ts";
import type { EventRouteRepository } from "../domain/EventRouteRepository.ts";
import type { OutboxEvent } from "../domain/OutboxEvent.ts";

// A failed delivery is recorded on the event, which stays pending for the next run.
export const deliverEvent =
  ({ eventRouteRepository }: { eventRouteRepository: EventRouteRepository }) =>
  async (event: OutboxEvent): Promise<OutboxEvent> => {
    try {
      await eventRouteRepository.deliver(event);
      return event.markAsPublished();
    } catch (error) {
      return event.recordFailure(DeliveryFailure.fromError(error));
    }
  };
