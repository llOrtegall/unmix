import { z } from "zod";
import { SeparationFailureCode, SeparationStage, StemName } from "../messages/separation.ts";

export const ACCEPTED_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
] as const;

export const ApiError = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});
export type ApiError = z.infer<typeof ApiError>;

export const CreateUploadRequest = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.int().positive(),
});
export type CreateUploadRequest = z.infer<typeof CreateUploadRequest>;

export const CreateUploadResponse = z.object({
  trackId: z.uuid(),
  uploadUrl: z.url(),
  expiresIn: z.int(),
});
export type CreateUploadResponse = z.infer<typeof CreateUploadResponse>;

export const JobStatus = z.enum(["queued", "processing", "completed", "failed"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobResponse = z.object({
  jobId: z.uuid(),
  trackId: z.uuid(),
  status: JobStatus,
  stage: SeparationStage.nullable(),
  progress: z.int().min(0).max(100),
  error: z.object({ code: SeparationFailureCode, message: z.string() }).nullable(),
});
export type JobResponse = z.infer<typeof JobResponse>;

export const TrackStatus = z.enum(["awaiting_upload", "uploaded", "separating", "completed", "failed"]);
export type TrackStatus = z.infer<typeof TrackStatus>;

export const StemResponse = z.object({
  name: StemName,
  /** Lossless FLAC download. */
  url: z.url(),
  /** MP3 for streaming playback. */
  previewUrl: z.url(),
  /** JSON `{ version: 1, peaks: number[] }`. */
  peaksUrl: z.url(),
  sizeBytes: z.int(),
  silent: z.boolean(),
});

export const TrackSummary = z.object({
  trackId: z.uuid(),
  title: z.string(),
  status: TrackStatus,
  durationSeconds: z.number().nullable(),
  /** Attribution for licensed content such as the demo song; null for uploads. */
  credit: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type TrackSummary = z.infer<typeof TrackSummary>;

export const TrackDetail = TrackSummary.extend({
  latestJobId: z.uuid().nullable(),
  stems: z.array(StemResponse),
});
export type TrackDetail = z.infer<typeof TrackDetail>;

export const ListTracksQuery = z.object({
  cursor: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListTracksQuery = z.infer<typeof ListTracksQuery>;

export const ListTracksResponse = z.object({
  items: z.array(TrackSummary),
  nextCursor: z.string().nullable(),
});
export type ListTracksResponse = z.infer<typeof ListTracksResponse>;

/** SSE `event:` names on GET /jobs/:jobId/events; `data:` is always a JobResponse. */
export const JOB_SSE_EVENTS = ["snapshot", "progress", "completed", "failed"] as const;
