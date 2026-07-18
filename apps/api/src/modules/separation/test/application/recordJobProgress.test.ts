import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import * as EventRepositoryMother from "../../../shared/test/helpers/EventRepositoryMother.ts";
import * as TransactionRepositoryMother from "../../../shared/test/helpers/TransactionRepositoryMother.ts";
import { recordJobProgress } from "../../application/recordJobProgress.ts";
import { JobNotFoundError } from "../../domain/errors/JobNotFoundError.ts";
import type { SeparationJob } from "../../domain/SeparationJob.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";
import * as JobUpdatesRepositoryMother from "../helpers/JobUpdatesRepositoryMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";

const setup = (job: SeparationJob | null) => {
  const dependencies = {
    jobRepository: JobRepositoryMother.create({ findByIdForUpdate: vi.fn().mockResolvedValue(job) }),
    eventRepository: EventRepositoryMother.create(),
    transactionRepository: TransactionRepositoryMother.create(),
    jobUpdatesRepository: JobUpdatesRepositoryMother.create(),
  };
  return { ...dependencies, recordJobProgress: recordJobProgress(dependencies) };
};

describe("recordJobProgress", () => {
  describe("Basic behaviour", () => {
    it("moves the locked job to processing and tells live listeners after the commit", async () => {
      const queued = SeparationJobMother.queued();
      const s = setup(queued);

      const job = await s.recordJobProgress({ jobId: queued.getId().toPrimitive(), stage: "separating", progress: 40 });

      expect(job.toPrimitive()).toMatchObject({ status: "processing", stage: "separating", progress: 40 });
      expect(s.jobRepository.findByIdForUpdate).toHaveBeenCalledWith(queued.getId());
      expect(s.jobRepository.save).toHaveBeenCalledWith(job);
      expect(s.jobUpdatesRepository.publish).toHaveBeenCalledWith(job);
      expect(s.transactionRepository.run.mock.invocationCallOrder[0]).toBeLessThan(
        s.jobUpdatesRepository.publish.mock.invocationCallOrder[0]!,
      );
    });
  });

  describe("Edge cases", () => {
    it("keeps a finished job as it was", async () => {
      const completed = SeparationJobMother.completed();
      const s = setup(completed);

      const job = await s.recordJobProgress({ jobId: completed.getId().toPrimitive(), stage: "separating", progress: 10 });

      expect(job.toPrimitive()).toEqual(completed.toPrimitive());
      expect(job.getEvents().isEmpty()).toBe(true);
    });
  });

  describe("Error scenarios", () => {
    it("rejects progress for an unknown job without notifying anyone", async () => {
      const s = setup(null);

      await expect(s.recordJobProgress({ jobId: faker.string.uuid(), stage: "separating", progress: 10 })).rejects.toThrow(
        JobNotFoundError,
      );
      expect(s.jobUpdatesRepository.publish).not.toHaveBeenCalled();
    });
  });
});
