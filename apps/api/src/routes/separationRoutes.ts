import type { JobResponse } from "@unmix/contracts";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { SeparationModule } from "../modules/separation/application/factory.ts";
import type { SeparationJob } from "../modules/separation/domain/SeparationJob.ts";

const TrackParams = z.object({ trackId: z.uuid() });
const JobParams = z.object({ jobId: z.uuid() });

const HEARTBEAT_MS = 15_000;

const toJobResponse = (job: SeparationJob): JobResponse => {
  const { id, trackId, status, stage, progress, failure } = job.toPrimitive();
  return { jobId: id, trackId, status, stage, progress, error: failure };
};

const toServerSentEvent = (event: string, job: SeparationJob): string =>
  `event: ${event}\ndata: ${JSON.stringify(toJobResponse(job))}\n\n`;

const eventNameFor = (job: SeparationJob): string => (job.isFinished() ? job.toPrimitive().status : "progress");

export const separationRoutes =
  (separation: SeparationModule): FastifyPluginAsync =>
  async (app) => {
    app.post("/tracks/:trackId/jobs", async (request, reply) => {
      const { trackId } = TrackParams.parse(request.params);
      const job = await separation.requestSeparation(trackId, request.userId);
      return reply.status(202).send(toJobResponse(job));
    });

    app.get("/jobs/:jobId", async (request) => {
      const { jobId } = JobParams.parse(request.params);
      return toJobResponse(await separation.findJob(jobId, request.userId));
    });

    // Server-Sent Events (ADR 0010): the current state first, then every change until the job ends.
    app.get("/jobs/:jobId/events", async (request, reply) => {
      const { jobId } = JobParams.parse(request.params);
      const response = reply.raw;
      let open = true;
      let heartbeat: NodeJS.Timeout | undefined;
      let stop = () => {};

      const end = () => {
        if (!open) return;
        open = false;
        stop();
        clearInterval(heartbeat);
        response.end();
      };

      const send = (event: string, job: SeparationJob) => {
        response.write(toServerSentEvent(event, job));
        if (job.isFinished()) end();
      };

      const watch = await separation.watchJob(jobId, request.userId, (job) => send(eventNameFor(job), job));
      stop = watch.stop;

      reply.hijack();
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
        "x-accel-buffering": "no",
        "access-control-allow-origin": String(reply.getHeader("access-control-allow-origin") ?? "*"),
      });
      heartbeat = setInterval(() => response.write(": ping\n\n"), HEARTBEAT_MS);
      request.raw.on("close", end);

      send("snapshot", watch.job);
    });
  };
