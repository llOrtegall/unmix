import { faker } from "@faker-js/faker";
import { describe, expect, it, vi } from "vitest";
import * as EventRepositoryMother from "../../../shared/test/helpers/EventRepositoryMother.ts";
import * as TransactionRepositoryMother from "../../../shared/test/helpers/TransactionRepositoryMother.ts";
import { TrackBusyError } from "../../../library/domain/errors/TrackBusyError.ts";
import * as TrackMother from "../../../library/test/helpers/TrackMother.ts";
import { requestSeparation } from "../../application/requestSeparation.ts";
import { ModelName } from "../../domain/ModelName.ts";
import { SeparationRequested } from "../../domain/SeparationRequested.ts";
import * as JobRepositoryMother from "../helpers/JobRepositoryMother.ts";
import * as TrackCatalogRepositoryMother from "../helpers/TrackCatalogRepositoryMother.ts";

const setup = (trackCatalogRepository = TrackCatalogRepositoryMother.create()) => {
  const dependencies = {
    trackCatalogRepository,
    jobRepository: JobRepositoryMother.create(),
    eventRepository: EventRepositoryMother.create(),
    transactionRepository: TransactionRepositoryMother.create(),
    model: ModelName.create("htdemucs_ft"),
  };
  return { ...dependencies, requestSeparation: requestSeparation(dependencies) };
};

describe("requestSeparation", () => {
  describe("Basic behaviour", () => {
    it("saves a queued job for the user's track and publishes the request in one transaction", async () => {
      const track = TrackMother.create({ status: "uploaded" });
      const userId = faker.string.uuid();
      const s = setup(TrackCatalogRepositoryMother.create({ findSeparableTrack: vi.fn().mockResolvedValue(track) }));

      const job = await s.requestSeparation(track.toPrimitive().id, userId);

      expect(job.toPrimitive()).toMatchObject({ trackId: track.toPrimitive().id, status: "queued", model: "htdemucs_ft" });
      expect(s.trackCatalogRepository.findSeparableTrack).toHaveBeenCalledWith(track.getId(), expect.anything());
      expect(s.jobRepository.save).toHaveBeenCalledWith(job);
      expect(s.eventRepository.publish).toHaveBeenCalledWith(job.getEvents());
      expect(job.getEvents().map((event) => event.getType())).toEqual([SeparationRequested.TYPE]);
      expect(s.transactionRepository.run).toHaveBeenCalledOnce();
    });
  });

  describe("Error scenarios", () => {
    it("creates nothing when the library refuses the track", async () => {
      const s = setup(TrackCatalogRepositoryMother.create({ findSeparableTrack: vi.fn().mockRejectedValue(new TrackBusyError("x")) }));

      await expect(s.requestSeparation(faker.string.uuid(), faker.string.uuid())).rejects.toThrow(TrackBusyError);
      expect(s.jobRepository.save).not.toHaveBeenCalled();
      expect(s.eventRepository.publish).not.toHaveBeenCalled();
    });
  });
});
