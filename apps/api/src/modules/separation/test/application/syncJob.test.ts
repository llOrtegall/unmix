import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import * as EventRepositoryMother from "../../../shared/test/helpers/EventRepositoryMother.ts";
import * as TransactionRepositoryMother from "../../../shared/test/helpers/TransactionRepositoryMother.ts";
import { syncJob } from "../../application/syncJob.ts";
import { JobNotFoundError } from "../../domain/errors/JobNotFoundError.ts";
import { JobFailure } from "../../domain/JobFailure.ts";
import { QueueJobState } from "../../domain/QueueJobState.ts";
import { SeparationCompleted } from "../../domain/SeparationCompleted.ts";
import { SeparationFailed } from "../../domain/SeparationFailed.ts";
import type { SeparationJob } from "../../domain/SeparationJob.ts";
import * as JobFailureMother from "../helpers/JobFailureMother.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";
import * as JobUpdatesRepositoryMother from "../helpers/JobUpdatesRepositoryMother.ts";
import * as QueueRepositoryMother from "../helpers/QueueRepositoryMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

const setup = (job: SeparationJob | null, state: QueueJobState) => {
  const dependencies = {
    jobRepository: JobRepositoryMother.create({ findByIdForUpdate: vi.fn().mockResolvedValue(job) }),
    eventRepository: EventRepositoryMother.create(),
    transactionRepository: TransactionRepositoryMother.create(),
    jobUpdatesRepository: JobUpdatesRepositoryMother.create(),
    queueRepository: QueueRepositoryMother.create({ findState: vi.fn().mockResolvedValue(state) }),
  };
  return { ...dependencies, syncJob: syncJob(dependencies) };
};

const eventTypes = (job: SeparationJob) => job.getEvents().map((event) => event.getType());

describe("syncJob", () => {
  describe("Basic behaviour", () => {
    it("completes the job with the result the queue holds and publishes the outcome", async () => {
      const processing = SeparationJobMother.processing();
      const result = SeparationResultMother.create();
      const s = setup(processing, QueueJobState.completed(result));

      const job = await s.syncJob(processing.getId().toPrimitive());

      expect(s.queueRepository.findState).toHaveBeenCalledWith(processing.getId());
      expect(job.toPrimitive().status).toBe("completed");
      expect(eventTypes(job)).toEqual([SeparationCompleted.TYPE]);
      expect(s.jobRepository.save).toHaveBeenCalledWith(job);
      expect(s.eventRepository.publish).toHaveBeenCalledWith(job.getEvents());
      expect(s.jobUpdatesRepository.publish).toHaveBeenCalledWith(job);
    });

    it("fails the job once the queue has no retries left", async () => {
      const processing = SeparationJobMother.processing();
      const failure = JobFailureMother.create();
      const s = setup(processing, QueueJobState.failed(failure));

      const job = await s.syncJob(processing.getId().toPrimitive());

      expect(job.toPrimitive()).toMatchObject({ status: "failed", failure: failure.toPrimitive() });
      expect(eventTypes(job)).toEqual([SeparationFailed.TYPE]);
    });
  });

  describe("Edge cases", () => {
    it("leaves a job alone while the queue is still retrying it", async () => {
      const processing = SeparationJobMother.processing();
      const s = setup(processing, QueueJobState.pending());

      const job = await s.syncJob(processing.getId().toPrimitive());

      expect(job.toPrimitive()).toEqual(processing.toPrimitive());
      expect(job.getEvents().isEmpty()).toBe(true);
    });

    it("fails a processing job that disappeared from the queue", async () => {
      const processing = SeparationJobMother.processing();
      const s = setup(processing, QueueJobState.missing());

      const job = await s.syncJob(processing.getId().toPrimitive());

      expect(job.toPrimitive().failure).toEqual(JobFailure.lostFromQueue().toPrimitive());
    });
  });

  describe("Error scenarios", () => {
    it("rejects an unknown job", async () => {
      const s = setup(null, QueueJobState.completed(SeparationResultMother.create()));

      await expect(s.syncJob(faker.string.uuid())).rejects.toThrow(JobNotFoundError);
      expect(s.eventRepository.publish).not.toHaveBeenCalled();
    });
  });
});
