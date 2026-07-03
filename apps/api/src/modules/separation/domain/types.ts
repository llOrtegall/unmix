export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type Stage = "downloading" | "normalizing" | "separating" | "uploading";
export type StemName = "vocals" | "drums" | "bass" | "guitar" | "piano" | "other";

export interface JobFailure {
  code: string;
  message: string;
}
