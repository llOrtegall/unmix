import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { watchJob } from "../../application/watchJob.ts";
import { JobNotFoundError } from "../../domain/errors/JobNotFoundError.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";
import * as JobUpdatesRepositoryMother from "../helpers/JobUpdatesRepositoryMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as TrackCatalogRepositoryMother from "../helpers/TrackCatalogRepositoryMother.ts";

describe("watchJob", () => {
  describe("Basic behaviour", () => {
    it("returns the current job and listens to its changes until stopped", async () => {
      const job = SeparationJobMother.processing();
      const unsubscribe = vi.fn();
      const listener = vi.fn();
      const jobUpdatesRepository = JobUpdatesRepositoryMother.create({ subscribe: vi.fn().mockReturnValue(unsubscribe) });
      const watch = watchJob({
        jobRepository: JobRepositoryMother.create({ findById: vi.fn().mockResolvedValue(job) }),
        trackCatalogRepository: TrackCatalogRepositoryMother.create(),
        jobUpdatesRepository,
      });

      const result = await watch(job.getId().toPrimitive(), faker.string.uuid(), listener);

      expect(result.job).toBe(job);
      expect(jobUpdatesRepository.subscribe).toHaveBeenCalledWith(job.getId(), listener);
      expect(result.stop).toBe(unsubscribe);
    });
  });

  describe("Error scenarios", () => {
    it("does not listen to a job the user cannot see", async () => {
      const jobUpdatesRepository = JobUpdatesRepositoryMother.create();
      const watch = watchJob({
        jobRepository: JobRepositoryMother.create(),
        trackCatalogRepository: TrackCatalogRepositoryMother.create(),
        jobUpdatesRepository,
      });

      await expect(watch(faker.string.uuid(), faker.string.uuid(), vi.fn())).rejects.toThrow(JobNotFoundError);
      expect(jobUpdatesRepository.subscribe).not.toHaveBeenCalled();
    });
  });
});
