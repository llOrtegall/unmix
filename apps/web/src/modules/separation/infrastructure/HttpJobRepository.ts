import type { JobResponse } from "@unmix/contracts";
import { httpGet, httpSend } from "../../shared/infrastructure/http.ts";
import type { TrackId } from "../../track/domain/TrackId.ts";
import { Job } from "../domain/Job.ts";
import type { JobId } from "../domain/JobId.ts";
import type { JobRepository } from "../domain/JobRepository.ts";
import { toJobPrimitive } from "./toJobPrimitive.ts";

export class HttpJobRepository implements JobRepository {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async findById(id: JobId): Promise<Job | null> {
    const response = await httpGet<JobResponse>(`${this.baseUrl}/jobs/${id.toPrimitive()}`);
    return response ? Job.fromPrimitive(toJobPrimitive(response)) : null;
  }

  async request(trackId: TrackId): Promise<Job> {
    const response = await httpSend<JobResponse>(`${this.baseUrl}/tracks/${trackId.toPrimitive()}/jobs`, { method: "POST" });
    return Job.fromPrimitive(toJobPrimitive(response));
  }
}
