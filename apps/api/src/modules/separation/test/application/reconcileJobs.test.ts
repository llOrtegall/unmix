import { describe, expect, it, vi } from "vitest";
import type { JobId } from "../../../shared/domain/JobId.ts";
import * as EventRepositoryMother from "../../../shared/test/helpers/EventRepositoryMother.ts";
import * as TransactionRepositoryMother from "../../../shared/test/helpers/TransactionRepositoryMother.ts";
import { reconcileJobs } from "../../application/reconcileJobs.ts";
import { QueueJobState } from "../../domain/QueueJobState.ts";
import { SeparationJobList } from "../../domain/SeparationJobList.ts";
import * as JobFailureMother from "../helpers/JobFailureMother.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";
import * as JobUpdatesRepositoryMother from "../helpers/JobUpdatesRepositoryMother.ts";
import * as QueueRepositoryMother from "../helpers/QueueRepositoryMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../helpers/SeparationResultMother.ts";

describe("reconcileJobs", () => {
  it("applies the outcomes that happened while the API was down", async () => {
    const finishedMeanwhile = SeparationJobMother.processing();
    const failedMeanwhile = SeparationJobMother.queued();
    const jobs = SeparationJobList.create([finishedMeanwhile, failedMeanwhile]);
    const states = new Map([
      [finishedMeanwhile.getId().toPrimitive(), QueueJobState.completed(SeparationResultMother.create())],
      [failedMeanwhile.getId().toPrimitive(), QueueJobState.failed(JobFailureMother.create())],
    ]);
    const jobRepository = JobRepositoryMother.create({
      findUnfinished: vi.fn().mockResolvedValue(jobs),
      findByIdForUpdate: vi.fn(async (id: JobId) => [finishedMeanwhile, failedMeanwhile].find((job) => job.getId().equals(id)) ?? null),
    });
    const queueRepository = QueueRepositoryMother.create({ findState: vi.fn(async (id: JobId) => states.get(id.toPrimitive())!) });

    const report = await reconcileJobs({
      jobRepository,
      queueRepository,
      eventRepository: EventRepositoryMother.create(),
      transactionRepository: TransactionRepositoryMother.create(),
      jobUpdatesRepository: JobUpdatesRepositoryMother.create(),
    })();

    expect(report).toEqual({ checked: 2 });
    expect(jobRepository.save.mock.calls.map(([job]) => job.toPrimitive().status)).toEqual(["completed", "failed"]);
  });

  it("has nothing to do when every job is finished", async () => {
    const jobRepository = JobRepositoryMother.create();

    const report = await reconcileJobs({
      jobRepository,
      queueRepository: QueueRepositoryMother.create(),
      eventRepository: EventRepositoryMother.create(),
      transactionRepository: TransactionRepositoryMother.create(),
      jobUpdatesRepository: JobUpdatesRepositoryMother.create(),
    })();

    expect(report).toEqual({ checked: 0 });
    expect(jobRepository.save).not.toHaveBeenCalled();
  });
});
