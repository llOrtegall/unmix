import { JOB_SSE_EVENTS, type JobResponse } from "@unmix/contracts";
import { DomainError } from "../../shared/domain/DomainError.ts";
import { RequestFailedError } from "../../shared/domain/errors/RequestFailedError.ts";
import type { Unsubscribe } from "../../shared/domain/Unsubscribe.ts";
import { Job } from "../domain/Job.ts";
import type { JobEventsRepository } from "../domain/JobEventsRepository.ts";
import type { JobId } from "../domain/JobId.ts";
import type { JobListener } from "../domain/JobListener.ts";
import { toJobPrimitive } from "./toJobPrimitive.ts";

/** EventSource reconnects on its own; the server always starts with a snapshot. */
export class EventSourceJobEventsRepository implements JobEventsRepository {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  watch(id: JobId, listener: JobListener): Unsubscribe {
    const url = `${this.baseUrl}/jobs/${id.toPrimitive()}/events`;
    const source = new EventSource(url);
    let isFinished = false;

    const handle = (event: MessageEvent<string>) => {
      try {
        const job = Job.fromPrimitive(toJobPrimitive(JSON.parse(event.data) as JobResponse));
        isFinished = job.isFinished();
        if (isFinished) source.close();
        listener.onUpdate(job);
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
        listener.onError(error);
      }
    };
    for (const name of JOB_SSE_EVENTS) source.addEventListener(name, handle);
    source.onerror = () => {
      if (!isFinished && source.readyState === EventSource.CLOSED) listener.onError(RequestFailedError.network(url));
    };
    return () => source.close();
  }
}
