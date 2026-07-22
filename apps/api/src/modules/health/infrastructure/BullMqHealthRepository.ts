import type { Queue } from "bullmq";
import type { HealthRepository } from "../domain/HealthRepository.ts";

export class BullMqHealthRepository implements HealthRepository {
  private readonly queue: Queue;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  async ping(): Promise<void> {
    await this.queue.getJobCounts();
  }
}
