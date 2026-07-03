import { SEPARATION_QUEUE } from "@unmix/contracts";
import { QueueEvents } from "bullmq";
import type { FastifyBaseLogger } from "fastify";
import type { JobLifecycle } from "../application/use-cases/job-lifecycle.ts";
import type { QueueInspector } from "../application/ports/index.ts";
import { createRedis, parseCompleted, parseProgress } from "./bullmq.ts";

/** Translates worker events from the queue into JobLifecycle calls. */
export function listenToSeparationQueue(deps: {
  redisUrl: string;
  lifecycle: JobLifecycle;
  inspector: QueueInspector;
  log: FastifyBaseLogger;
}): QueueEvents {
  const { lifecycle, inspector, log } = deps;
  const events = new QueueEvents(SEPARATION_QUEUE, { connection: createRedis(deps.redisUrl) });

  const guard = (name: string, work: () => Promise<unknown>) =>
    work().catch((error) => log.error({ err: error, event: name }, "queue event handling failed"));

  events.on("progress", ({ jobId, data }) =>
    guard("progress", async () => {
      const progress = parseProgress(data);
      if (progress) await lifecycle.recordProgress(jobId, progress.stage, progress.progress);
    }),
  );

  events.on("completed", ({ jobId, returnvalue }) =>
    guard("completed", async () => {
      const result = await lifecycle.complete(jobId, parseCompleted(returnvalue));
      if (result.isErr()) log.warn({ jobId, error: result.error }, "completion rejected");
    }),
  );

  // Confirm with the queue: only a job that exhausted its retries is a final failure.
  events.on("failed", ({ jobId }) =>
    guard("failed", async () => {
      const state = await inspector.inspect(jobId);
      if (state.state === "failed") await lifecycle.fail(jobId, state.failure);
    }),
  );

  return events;
}
