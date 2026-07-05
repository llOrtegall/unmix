export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type Stage = "downloading" | "normalizing" | "separating" | "uploading";

export interface Job {
  id: string;
  trackId: string;
  status: JobStatus;
  stage: Stage | null;
  progress: number;
  error: { code: string; message: string } | null;
}

export const isFinished = (job: Pick<Job, "status">): boolean =>
  job.status === "completed" || job.status === "failed";
