import { faker } from "@faker-js/faker";
import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../middlewares/errorHandler.ts";
import { TrackBusyError } from "../modules/library/domain/errors/TrackBusyError.ts";
import type { SeparationModule } from "../modules/separation/application/factory.ts";
import { JobNotFoundError } from "../modules/separation/domain/errors/JobNotFoundError.ts";
import type { JobListener } from "../modules/separation/domain/JobUpdatesRepository.ts";
import type { SeparationJob } from "../modules/separation/domain/SeparationJob.ts";
import * as SeparationJobMother from "../modules/separation/test/helpers/SeparationJobMother.ts";
import * as SeparationResultMother from "../modules/separation/test/helpers/SeparationResultMother.ts";
import { separationRoutes } from "./separationRoutes.ts";

const userId = faker.string.uuid();

const appWith = (separation: Partial<SeparationModule>) =>
  Fastify()
    .setErrorHandler(errorHandler)
    .addHook("preHandler", async (request) => {
      request.userId = userId;
    })
    .register(separationRoutes(separation as SeparationModule));

const jobResponse = (job: SeparationJob) => {
  const { id, trackId, status, stage, progress, failure } = job.toPrimitive();
  return { jobId: id, trackId, status, stage, progress, error: failure };
};

const serverSentEvents = (payload: string) =>
  payload
    .split("\n\n")
    .filter((chunk) => chunk.startsWith("event: "))
    .map((chunk) => {
      const [event, data] = chunk.split("\n");
      return { event: event!.slice("event: ".length), data: JSON.parse(data!.slice("data: ".length)) };
    });

describe("separationRoutes", () => {
  describe("POST /tracks/:trackId/jobs", () => {
    it("responds 202 with the queued job of the signed-in user", async () => {
      const job = SeparationJobMother.queued();
      const requestSeparation = vi.fn().mockResolvedValue(job);
      const trackId = job.getTrackId().toPrimitive();

      const response = await appWith({ requestSeparation }).inject({ method: "POST", url: `/tracks/${trackId}/jobs` });

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual(jobResponse(job));
      expect(requestSeparation).toHaveBeenCalledWith(trackId, userId);
    });

    it("responds 400 when the track id is not a UUID", async () => {
      const response = await appWith({}).inject({ method: "POST", url: "/tracks/abc/jobs" });

      expect(response.statusCode).toBe(400);
    });

    it("responds 409 with the library's code when the track is busy", async () => {
      const requestSeparation = vi.fn().mockRejectedValue(new TrackBusyError("t"));

      const response = await appWith({ requestSeparation }).inject({ method: "POST", url: `/tracks/${faker.string.uuid()}/jobs` });

      expect(response.statusCode).toBe(409);
      expect(response.json().code).toBe("track.busy");
    });
  });

  describe("GET /jobs/:jobId", () => {
    it("responds with the job and its failure", async () => {
      const job = SeparationJobMother.failed();
      const findJob = vi.fn().mockResolvedValue(job);

      const response = await appWith({ findJob }).inject({ method: "GET", url: `/jobs/${job.getId().toPrimitive()}` });

      expect(response.json()).toEqual(jobResponse(job));
      expect(findJob).toHaveBeenCalledWith(job.getId().toPrimitive(), userId);
    });

    it("responds 404 job.not_found when the user cannot see the job", async () => {
      const findJob = vi.fn().mockRejectedValue(new JobNotFoundError("j"));

      const response = await appWith({ findJob }).inject({ method: "GET", url: `/jobs/${faker.string.uuid()}` });

      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe("job.not_found");
    });
  });

  describe("GET /jobs/:jobId/events", () => {
    it("sends the snapshot of a finished job and closes the stream", async () => {
      const job = SeparationJobMother.completed();
      const stop = vi.fn();
      const watchJob = vi.fn().mockResolvedValue({ job, stop });

      const response = await appWith({ watchJob }).inject({ method: "GET", url: `/jobs/${job.getId().toPrimitive()}/events` });

      expect(response.headers["content-type"]).toBe("text/event-stream");
      expect(serverSentEvents(response.payload)).toEqual([{ event: "snapshot", data: jobResponse(job) }]);
      expect(stop).toHaveBeenCalledOnce();
    });

    it("streams every change after the snapshot until the job ends", async () => {
      const queued = SeparationJobMother.queued();
      const processing = SeparationJobMother.processing({ id: queued.getId().toPrimitive() });
      const completed = processing.complete(SeparationResultMother.create());
      const stop = vi.fn();
      const watchJob = vi.fn(async (_jobId: string, _userId: string, listener: JobListener) => {
        setTimeout(() => {
          listener(processing);
          listener(completed);
        });
        return { job: queued, stop };
      });

      const response = await appWith({ watchJob }).inject({ method: "GET", url: `/jobs/${queued.getId().toPrimitive()}/events` });

      expect(serverSentEvents(response.payload)).toEqual([
        { event: "snapshot", data: jobResponse(queued) },
        { event: "progress", data: jobResponse(processing) },
        { event: "completed", data: jobResponse(completed) },
      ]);
      expect(stop).toHaveBeenCalledOnce();
    });

    it("responds 404 before opening the stream when the user cannot see the job", async () => {
      const watchJob = vi.fn().mockRejectedValue(new JobNotFoundError("j"));

      const response = await appWith({ watchJob }).inject({ method: "GET", url: `/jobs/${faker.string.uuid()}/events` });

      expect(response.statusCode).toBe(404);
      expect(response.json().code).toBe("job.not_found");
    });
  });
});
