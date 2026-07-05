import { JobResponse } from "@unmix/contracts";
import type { AppError, JobEventsGateway } from "../../application/ports/index.ts";
import type { Job } from "../../domain/job.ts";
import { toJob } from "../http/http-track-gateway.ts";

/** EventSource reconnects on its own; the server always starts with a snapshot. */
export class EventSourceJobEvents implements JobEventsGateway {
  #base: string;

  constructor(baseUrl: string) {
    this.#base = baseUrl;
  }

  watch(jobId: string, onUpdate: (job: Job) => void, onError: (error: AppError) => void): () => void {
    const source = new EventSource(`${this.#base}/jobs/${jobId}/events`);
    let finished = false;
    const handle = (e: MessageEvent<string>) => {
      const parsed = JobResponse.safeParse(JSON.parse(e.data));
      if (!parsed.success) return;
      const job = toJob(parsed.data);
      if (job.status === "completed" || job.status === "failed") {
        finished = true;
        source.close();
      }
      onUpdate(job);
    };
    for (const name of ["snapshot", "progress", "completed", "failed"]) source.addEventListener(name, handle);
    source.onerror = () => {
      if (!finished && source.readyState === EventSource.CLOSED) onError({ code: "NETWORK_ERROR", message: "" });
    };
    return () => source.close();
  }
}
