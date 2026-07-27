import type { JobResponse } from "@unmix/contracts";
import type { JobPrimitive } from "../domain/Job.ts";

export const toJobPrimitive = (response: JobResponse): JobPrimitive => ({
  id: response.jobId,
  trackId: response.trackId,
  status: response.status,
  stage: response.stage,
  progress: response.progress,
  failure: response.error,
});
