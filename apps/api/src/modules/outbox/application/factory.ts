import type { Queue } from "bullmq";
import type { DrizzleTransactionRepository } from "../../shared/infrastructure/DrizzleTransactionRepository.ts";
import { BullMqEventRouteRepository } from "../infrastructure/BullMqEventRouteRepository.ts";
import { DrizzleOutboxRepository } from "../infrastructure/DrizzleOutboxRepository.ts";
import { relayPendingEvents } from "./relayPendingEvents.ts";

export const outboxModule = (transactions: DrizzleTransactionRepository, queue: Queue) => {
  const outboxRepository = new DrizzleOutboxRepository(transactions);
  const eventRouteRepository = new BullMqEventRouteRepository(queue);

  return {
    relayPendingEvents: relayPendingEvents({ outboxRepository, eventRouteRepository, transactionRepository: transactions }),
  };
};

export type OutboxModule = ReturnType<typeof outboxModule>;
