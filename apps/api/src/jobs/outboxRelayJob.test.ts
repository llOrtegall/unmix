import type { FastifyBaseLogger } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OutboxModule } from "../modules/outbox/application/factory.ts";
import { OutboxEventList } from "../modules/outbox/domain/OutboxEventList.ts";
import * as OutboxEventMother from "../modules/outbox/test/helpers/OutboxEventMother.ts";
import { outboxRelayJob } from "./outboxRelayJob.ts";

const RELAY_INTERVAL_MS = 500;

describe("outboxRelayJob", () => {
  const log = { error: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const start = (relayPendingEvents: OutboxModule["relayPendingEvents"]) =>
    outboxRelayJob({ relayPendingEvents }, log as unknown as FastifyBaseLogger);

  it("relays the outbox on every tick until stopped", async () => {
    const relayPendingEvents = vi.fn().mockResolvedValue(OutboxEventList.empty());
    const stop = start(relayPendingEvents);

    await vi.advanceTimersByTimeAsync(RELAY_INTERVAL_MS * 2);
    stop();
    await vi.advanceTimersByTimeAsync(RELAY_INTERVAL_MS * 2);

    expect(relayPendingEvents).toHaveBeenCalledTimes(2);
    expect(log.error).not.toHaveBeenCalled();
  });

  it("never overlaps two relays", async () => {
    const relayPendingEvents = vi.fn(() => new Promise<OutboxEventList>(() => {}));
    const stop = start(relayPendingEvents);

    await vi.advanceTimersByTimeAsync(RELAY_INTERVAL_MS * 3);
    stop();

    expect(relayPendingEvents).toHaveBeenCalledOnce();
  });

  it("logs the events that could not be delivered", async () => {
    const failed = OutboxEventMother.failedBefore();
    const stop = start(vi.fn().mockResolvedValue(OutboxEventList.create([failed, OutboxEventMother.published()])));

    await vi.advanceTimersByTimeAsync(RELAY_INTERVAL_MS);
    stop();

    expect(log.error).toHaveBeenCalledWith({ events: [failed.toPrimitive()] }, "outbox delivery failed");
  });

  it("logs a relay that fails as a whole and keeps going", async () => {
    const relayPendingEvents = vi.fn().mockRejectedValueOnce(new Error("database down")).mockResolvedValue(OutboxEventList.empty());
    const stop = start(relayPendingEvents);

    await vi.advanceTimersByTimeAsync(RELAY_INTERVAL_MS * 2);
    stop();

    expect(log.error).toHaveBeenCalledWith({ err: expect.any(Error) }, "outbox relay failed");
    expect(relayPendingEvents).toHaveBeenCalledTimes(2);
  });
});
