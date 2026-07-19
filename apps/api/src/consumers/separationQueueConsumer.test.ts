import { EventEmitter } from "node:events";
import { faker } from "@faker-js/faker";
import type { QueueEvents } from "bullmq";
import type { FastifyBaseLogger } from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { SeparationModule } from "../modules/separation/application/factory.ts";
import { JobNotFoundError } from "../modules/separation/domain/errors/JobNotFoundError.ts";
import { separationQueueConsumer } from "./separationQueueConsumer.ts";

const setup = (separation: Partial<SeparationModule>) => {
  const queueEvents = new EventEmitter();
  const log = { warn: vi.fn(), error: vi.fn() };
  separationQueueConsumer(queueEvents as unknown as QueueEvents, separation as SeparationModule, log as unknown as FastifyBaseLogger);
  return { queueEvents, log };
};

describe("separationQueueConsumer", () => {
  describe("Basic behaviour", () => {
    it("records the progress the worker reports", async () => {
      const recordJobProgress = vi.fn().mockResolvedValue(undefined);
      const { queueEvents } = setup({ recordJobProgress });
      const jobId = faker.string.uuid();

      queueEvents.emit("progress", { jobId, data: { stage: "separating", progress: 40 } });

      await vi.waitFor(() => expect(recordJobProgress).toHaveBeenCalledWith({ jobId, stage: "separating", progress: 40 }));
    });

    it.each(["completed", "failed"])("syncs the job with the queue when it is %s", async (event) => {
      const syncJob = vi.fn().mockResolvedValue(undefined);
      const { queueEvents } = setup({ syncJob });
      const jobId = faker.string.uuid();

      queueEvents.emit(event, { jobId });

      await vi.waitFor(() => expect(syncJob).toHaveBeenCalledWith(jobId));
    });
  });

  describe("Error scenarios", () => {
    it("logs a rejected event as a warning", async () => {
      const { queueEvents, log } = setup({ syncJob: vi.fn().mockRejectedValue(new JobNotFoundError("j")) });

      queueEvents.emit("completed", { jobId: faker.string.uuid() });

      await vi.waitFor(() => expect(log.warn).toHaveBeenCalledOnce());
    });

    it("logs a progress payload that breaks the contract as an error", async () => {
      const recordJobProgress = vi.fn();
      const { queueEvents, log } = setup({ recordJobProgress });

      queueEvents.emit("progress", { jobId: faker.string.uuid(), data: 42 });

      await vi.waitFor(() => expect(log.error).toHaveBeenCalledOnce());
      expect(recordJobProgress).not.toHaveBeenCalled();
    });
  });
});
