import type { JobResponse } from "@unmix/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { sendError } from "../../../shared/interface/http.ts";
import type { JobUpdates, JobView } from "../application/ports/index.ts";
import type { GetJob } from "../application/use-cases/get-job.ts";
import type { RequestSeparation } from "../application/use-cases/request-separation.ts";

const TrackParams = z.object({ trackId: z.uuid() });
const JobParams = z.object({ jobId: z.uuid() });

export interface SeparationUseCases {
  requestSeparation: RequestSeparation;
  getJob: GetJob;
  updates: JobUpdates;
}

export function toJobResponse(job: JobView): JobResponse {
  return {
    jobId: job.id,
    trackId: job.trackId,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.failure as JobResponse["error"],
  };
}

export function separationRoutes(app: FastifyInstance, uc: SeparationUseCases): void {
  app.post("/tracks/:trackId/jobs", async (req, reply) => {
    const params = TrackParams.parse(req.params);
    const result = await uc.requestSeparation.execute(params.trackId, req.userId);
    return result.isOk() ? reply.status(202).send(toJobResponse(result.value)) : sendError(reply, result.error);
  });

  app.get("/jobs/:jobId", async (req, reply) => {
    const params = JobParams.parse(req.params);
    const result = await uc.getJob.execute(params.jobId, req.userId);
    return result.isOk() ? toJobResponse(result.value) : sendError(reply, result.error);
  });

  // Server-Sent Events (ADR 0010): snapshot first, then live changes until the job ends.
  app.get("/jobs/:jobId/events", async (req, reply) => {
    const params = JobParams.parse(req.params);
    const current = await uc.getJob.execute(params.jobId, req.userId);
    if (current.isErr()) return sendError(reply, current.error);

    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "x-accel-buffering": "no",
      "access-control-allow-origin": String(reply.getHeader("access-control-allow-origin") ?? "*"),
    });

    const send = (event: string, job: JobView) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(toJobResponse(job))}\n\n`);
    let closed = false;
    const end = () => {
      if (closed) return;
      closed = true;
      unsubscribe();
      clearInterval(heartbeat);
      res.end();
    };

    const unsubscribe = uc.updates.subscribe(params.jobId, (job) => {
      if (job.status === "completed" || job.status === "failed") {
        send(job.status, job);
        end();
      } else {
        send("progress", job);
      }
    });
    const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);
    req.raw.on("close", end);

    send("snapshot", current.value);
    if (current.value.status === "completed" || current.value.status === "failed") end();
  });
}
