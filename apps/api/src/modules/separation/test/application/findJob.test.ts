import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import { UserId } from "../../../shared/domain/UserId.ts";
import { findJob } from "../../application/findJob.ts";
import { JobNotFoundError } from "../../domain/errors/JobNotFoundError.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";
import * as SeparationJobMother from "../helpers/SeparationJobMother.ts";
import * as TrackCatalogRepositoryMother from "../helpers/TrackCatalogRepositoryMother.ts";

describe("findJob", () => {
  describe("Basic behaviour", () => {
    it("returns the job of a track the user owns", async () => {
      const job = SeparationJobMother.processing();
      const userId = faker.string.uuid();
      const jobRepository = JobRepositoryMother.create({ findById: vi.fn().mockResolvedValue(job) });
      const trackCatalogRepository = TrackCatalogRepositoryMother.create();

      const found = await findJob({ jobRepository, trackCatalogRepository })(job.getId().toPrimitive(), userId);

      expect(found).toBe(job);
      expect(trackCatalogRepository.isOwnedBy).toHaveBeenCalledWith(job.getTrackId(), UserId.fromPrimitive(userId));
    });
  });

  describe("Error scenarios", () => {
    it("rejects a job that does not exist", async () => {
      const find = findJob({ jobRepository: JobRepositoryMother.create(), trackCatalogRepository: TrackCatalogRepositoryMother.create() });

      await expect(find(faker.string.uuid(), faker.string.uuid())).rejects.toThrow(JobNotFoundError);
    });

    it("hides the job of someone else's track", async () => {
      const job = SeparationJobMother.queued();
      const find = findJob({
        jobRepository: JobRepositoryMother.create({ findById: vi.fn().mockResolvedValue(job) }),
        trackCatalogRepository: TrackCatalogRepositoryMother.create({ isOwnedBy: vi.fn().mockResolvedValue(false) }),
      });

      await expect(find(job.getId().toPrimitive(), faker.string.uuid())).rejects.toThrow(JobNotFoundError);
    });
  });
});
