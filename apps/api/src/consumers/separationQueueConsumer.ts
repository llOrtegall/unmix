import { SeparationProgressV1 } from "@unmix/contracts";
import type { QueueEvents } from "bullmq";
import type { FastifyBaseLogger } from "fastify";
import { DomainError } from "../modules/shared/domain/DomainError.ts";
import type { SeparationModule } from "../modules/separation/application/factory.ts";

export const separationQueueConsumer = (queueEvents: QueueEvents, separation: SeparationModule, log: FastifyBaseLogger): void => {
  const handle = (event: string, jobId: string, work: () => Promise<unknown>) =>
    work().catch((error: unknown) => {
      const level = error instanceof DomainError ? "warn" : "error";
      log[level]({ err: error, event, jobId }, "queue event handling failed");
    });

  queueEvents.on("progress", ({ jobId, data }) =>
    handle("progress", jobId, async () => separation.recordJobProgress({ jobId, ...SeparationProgressV1.parse(data) })),
  );
  queueEvents.on("completed", ({ jobId }) => handle("completed", jobId, () => separation.syncJob(jobId)));
  queueEvents.on("failed", ({ jobId }) => handle("failed", jobId, () => separation.syncJob(jobId)));
};
