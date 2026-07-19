import type { FastifyBaseLogger } from "fastify";
import type { OutboxModule } from "../modules/outbox/application/factory.ts";

const RELAY_INTERVAL_MS = 500;

export const outboxRelayJob = (outbox: OutboxModule, log: FastifyBaseLogger): (() => void) => {
  let running = false;

  const relay = async () => {
    if (running) return;
    running = true;
    try {
      const failed = (await outbox.relayPendingEvents()).filterPending();
      if (!failed.isEmpty()) {
        log.error({ events: failed.map((event) => event.toPrimitive()) }, "outbox delivery failed");
      }
    } catch (error) {
      log.error({ err: error }, "outbox relay failed");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void relay(), RELAY_INTERVAL_MS);
  return () => clearInterval(timer);
};
