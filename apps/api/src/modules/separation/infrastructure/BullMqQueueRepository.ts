import { SeparationCompletedV1, SeparationFailureV1, SeparationProgressV1 } from "@unmix/contracts";
import type { Job, Queue } from "bullmq";
import type { JobId } from "../../shared/domain/JobId.ts";
import { JobFailure } from "../domain/JobFailure.ts";
import { QueueJobState } from "../domain/QueueJobState.ts";
import type { QueueRepository } from "../domain/QueueRepository.ts";

const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export class BullMqQueueRepository implements QueueRepository {
  private readonly queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  async findState(id: JobId): Promise<QueueJobState> {
    const job = await this.queue.getJob(id.toPrimitive());
    if (!job) return QueueJobState.missing();
    switch (await job.getState()) {
      case "completed":
        return this.toCompleted(job);
      case "failed":
        return QueueJobState.failed(this.toFailure(job.failedReason));
      case "active":
        return this.toActive(job);
      default:
        return QueueJobState.pending();
    }
  }

  private toCompleted(job: Job): QueueJobState {
    const parsed = SeparationCompletedV1.safeParse(job.returnvalue);
    if (!parsed.success) return QueueJobState.failed(JobFailure.invalidResult());
    const { durationSeconds, stems } = parsed.data;
    return QueueJobState.fromPrimitive({
      state: "completed",
      // Workers older than the MIDI feature omit midiKey.
      result: { durationSeconds, stems: stems.map(({ format: _format, midiKey, ...stem }) => ({ ...stem, midiKey: midiKey ?? null })) },
    });
  }

  // An active job that has not reported progress yet has nothing to apply.
  private toActive(job: Job): QueueJobState {
    const parsed = SeparationProgressV1.safeParse(job.progress);
    return parsed.success ? QueueJobState.fromPrimitive({ state: "active", ...parsed.data }) : QueueJobState.pending();
  }

  private toFailure(reason = ""): JobFailure {
    const parsed = SeparationFailureV1.safeParse(readJson(reason));
    return parsed.success ? JobFailure.create(parsed.data.code, parsed.data.message) : JobFailure.unexpected(reason);
  }
}
