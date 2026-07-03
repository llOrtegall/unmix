import type { DomainEvent } from "../../../shared/kernel/domain-event.ts";
import type { StemName } from "./types.ts";

export const SEPARATION_REQUESTED = "separation.requested";
export const SEPARATION_COMPLETED = "separation.completed";
export const SEPARATION_FAILED = "separation.failed";

export type SeparationRequested = DomainEvent<
  typeof SEPARATION_REQUESTED,
  { jobId: string; trackId: string; inputKey: string; outputPrefix: string; model: string }
>;

export type SeparationCompleted = DomainEvent<
  typeof SEPARATION_COMPLETED,
  {
    jobId: string;
    trackId: string;
    durationSeconds: number;
    stems: { name: StemName; key: string; sizeBytes: number; silent: boolean }[];
  }
>;

export type SeparationFailed = DomainEvent<
  typeof SEPARATION_FAILED,
  { jobId: string; trackId: string; code: string; message: string }
>;
