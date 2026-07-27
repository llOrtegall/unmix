import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { TrackId } from "../../../track/domain/TrackId.ts";
import { requestSeparation } from "../../application/requestSeparation.ts";
import { watchJob } from "../../application/watchJob.ts";
import { JobNotFoundError } from "../../domain/errors/JobNotFoundError.ts";
import * as JobEventsRepositoryMother from "../helpers/JobEventsRepositoryMother.ts";
import * as JobMother from "../helpers/JobMother.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";

const listener = () => ({ onUpdate: vi.fn(), onError: vi.fn() });

describe("watchJob", () => {
  it("reports the current job and follows it while it runs", async () => {
    const job = JobMother.create();
    const stop = vi.fn();
    const jobRepository = JobRepositoryMother.create({ findById: vi.fn().mockResolvedValue(job) });
    const jobEventsRepository = JobEventsRepositoryMother.create({ watch: vi.fn().mockReturnValue(stop) });
    const watcher = listener();

    const unsubscribe = await watchJob({ jobRepository, jobEventsRepository })(job.getId().toPrimitive(), watcher);

    expect(watcher.onUpdate).toHaveBeenCalledWith(job);
    expect(jobEventsRepository.watch).toHaveBeenCalledWith(job.getId(), watcher);
    expect(unsubscribe).toBe(stop);
  });

  it("does not follow a job that already finished", async () => {
    const job = JobMother.failed();
    const jobEventsRepository = JobEventsRepositoryMother.create();
    const watcher = listener();

    const unsubscribe = await watchJob({ jobRepository: JobRepositoryMother.create({ findById: vi.fn().mockResolvedValue(job) }), jobEventsRepository })(
      job.getId().toPrimitive(),
      watcher,
    );

    expect(watcher.onUpdate).toHaveBeenCalledWith(job);
    expect(jobEventsRepository.watch).not.toHaveBeenCalled();
    expect(() => unsubscribe()).not.toThrow();
  });

  it("throws for an unknown job without opening the stream", async () => {
    const jobEventsRepository = JobEventsRepositoryMother.create();

    await expect(watchJob({ jobRepository: JobRepositoryMother.create(), jobEventsRepository })(faker.string.uuid(), listener())).rejects.toThrow(
      JobNotFoundError,
    );
    expect(jobEventsRepository.watch).not.toHaveBeenCalled();
  });
});

describe("requestSeparation", () => {
  it("returns the new job for the track", async () => {
    const job = JobMother.queued();
    const jobRepository = JobRepositoryMother.create({ request: vi.fn().mockResolvedValue(job) });
    const trackId = faker.string.uuid();

    expect(await requestSeparation({ jobRepository })(trackId)).toBe(job);
    expect(jobRepository.request).toHaveBeenCalledWith(TrackId.create(trackId));
  });
});
