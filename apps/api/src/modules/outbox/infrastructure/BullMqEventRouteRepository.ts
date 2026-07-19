import { SEPARATION_REQUESTED_V1, SeparationRequestedV1 } from "@unmix/contracts";
import type { JobsOptions, Queue } from "bullmq";
import { SeparationRequested } from "../../separation/domain/SeparationRequested.ts";
import type { EventRouteRepository } from "../domain/EventRouteRepository.ts";
import type { OutboxEvent } from "../domain/OutboxEvent.ts";

const DAY_SECONDS = 24 * 3600;

const SEPARATION_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 7 * DAY_SECONDS },
  removeOnFail: { age: 30 * DAY_SECONDS },
};

// Only events with an external consumer have a route; the rest are just marked as published.
export class BullMqEventRouteRepository implements EventRouteRepository {
  private readonly queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  async deliver(event: OutboxEvent): Promise<void> {
    const { id, type, payload } = event.toPrimitive();
    if (type !== SeparationRequested.TYPE) return;
    const message = SeparationRequestedV1.parse({ ...payload, messageId: id });
    // The queue job id is the separation job id, so delivering the same event twice adds one job.
    await this.queue.add(SEPARATION_REQUESTED_V1, message, { ...SEPARATION_JOB_OPTIONS, jobId: message.jobId });
  }
}
