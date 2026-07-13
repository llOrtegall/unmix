import {
  SEPARATION_QUEUE,
  SEPARATION_REQUESTED_V1,
  SeparationCompletedV1,
  SeparationFailureV1,
  SeparationRequestedV1,
  SeparationProgressV1,
} from "@unmix/contracts";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import type { OutboxRoute } from "../../../shared/infrastructure/outbox.ts";
import type { QueueInspector, QueueJobState } from "../application/ports/index.ts";
import type { SeparationRequested } from "../domain/events.ts";

/** BullMQ 6 needs a constructed client in ESM; blocking readers need `maxRetriesPerRequest: null`. */
export function createRedis(redisUrl: string): Redis {
  return new Redis(redisUrl, { maxRetriesPerRequest: null });
}

export function createSeparationQueue(redisUrl: string): Queue {
  return new Queue(SEPARATION_QUEUE, { connection: createRedis(redisUrl) });
}

/** Outbox route: domain event -> versioned queue message (contracts, ADR 0016). */
export function separationRequestedRoute(queue: Queue): OutboxRoute {
  return async (event) => {
    const payload = event.payload as SeparationRequested["payload"];
    const message = SeparationRequestedV1.parse({ messageId: event.id, ...payload });
    await queue.add(SEPARATION_REQUESTED_V1, message, {
      jobId: message.jobId, // idempotent: re-publishing the same event is a no-op
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 30 * 24 * 3600 },
    });
  };
}

export function parseFailure(reason: string | undefined) {
  try {
    const failure = SeparationFailureV1.parse(JSON.parse(reason ?? ""));
    return { code: failure.code, message: failure.message };
  } catch {
    return { code: "SEPARATION_ERROR", message: reason || "Unknown worker error." };
  }
}

export function parseCompleted(value: unknown) {
  const { durationSeconds, stems } = SeparationCompletedV1.parse(value);
  // Workers older than the MIDI feature omit midiKey.
  return { durationSeconds, stems: stems.map(({ format: _format, midiKey, ...stem }) => ({ ...stem, midiKey: midiKey ?? null })) };
}

export function parseProgress(value: unknown) {
  const parsed = SeparationProgressV1.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export class BullMqQueueInspector implements QueueInspector {
  #queue: Queue;

  constructor(queue: Queue) {
    this.#queue = queue;
  }

  async inspect(jobId: string): Promise<QueueJobState> {
    const job = await this.#queue.getJob(jobId);
    if (!job) return { state: "missing" };
    const state = await job.getState();
    switch (state) {
      case "completed":
        return { state: "completed", result: parseCompleted(job.returnvalue) };
      case "failed":
        return { state: "failed", failure: parseFailure(job.failedReason) };
      case "active": {
        const progress = parseProgress(job.progress);
        return { state: "active", stage: progress?.stage ?? null, progress: progress?.progress ?? 0 };
      }
      default:
        return { state: "pending" };
    }
  }
}
