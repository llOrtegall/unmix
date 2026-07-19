import type { TransactionRepository } from "../../shared/domain/TransactionRepository.ts";
import type { EventRouteRepository } from "../domain/EventRouteRepository.ts";
import type { OutboxEventList } from "../domain/OutboxEventList.ts";
import type { OutboxRepository } from "../domain/OutboxRepository.ts";
import { deliverPendingEvents } from "./deliverPendingEvents.ts";

interface Dependencies {
  readonly outboxRepository: OutboxRepository;
  readonly eventRouteRepository: EventRouteRepository;
  readonly transactionRepository: TransactionRepository;
}

// Pending events stay locked until the batch commits, so two API instances never deliver the same one at once.
export const relayPendingEvents = ({ transactionRepository, ...dependencies }: Dependencies) => {
  const deliverPending = deliverPendingEvents(dependencies);

  return (): Promise<OutboxEventList> => transactionRepository.run(() => deliverPending());
};
