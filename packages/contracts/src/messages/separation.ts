import { z } from "zod";

// Queue and message names shared by the API (producer) and the worker (consumer).
export const SEPARATION_QUEUE = "separation";
export const SEPARATION_REQUESTED_V1 = "separation.requested.v1";

export const StemName = z.enum(["vocals", "drums", "bass", "guitar", "piano", "other"]).meta({ title: "StemName" });
export type StemName = z.infer<typeof StemName>;

export const SeparationModel = z.enum(["htdemucs_6s", "htdemucs_ft", "htdemucs"]).meta({ title: "SeparationModel" });
export type SeparationModel = z.infer<typeof SeparationModel>;

/** Job data: what to separate and where to put the result. */
export const SeparationRequestedV1 = z
  .object({
    messageId: z.uuid(),
    jobId: z.uuid(),
    trackId: z.uuid(),
    inputKey: z.string().min(1),
    outputPrefix: z.string().min(1),
    model: SeparationModel,
  })
  .meta({ title: "SeparationRequestedV1" });
export type SeparationRequestedV1 = z.infer<typeof SeparationRequestedV1>;

export const SeparationStage = z.enum(["downloading", "normalizing", "separating", "uploading"]).meta({ title: "SeparationStage" });
export type SeparationStage = z.infer<typeof SeparationStage>;

/** Job progress payload (BullMQ `job.updateProgress`). */
export const SeparationProgressV1 = z
  .object({
    stage: SeparationStage,
    progress: z.int().min(0).max(100),
  })
  .meta({ title: "SeparationProgressV1" });
export type SeparationProgressV1 = z.infer<typeof SeparationProgressV1>;

export const StemResult = z
  .object({
    name: StemName,
    key: z.string().min(1),
    sizeBytes: z.int().nonnegative(),
    format: z.literal("flac"),
    silent: z.boolean(),
    /** MP3 for streaming playback in the browser. */
    previewKey: z.string().min(1),
    /** JSON `{ version: 1, peaks: number[] }` (0..1) to draw the waveform. */
    peaksKey: z.string().min(1),
    /** Basic Pitch transcription; absent for drums and silent stems (and older workers). */
    midiKey: z.string().min(1).nullish(),
  })
  .meta({ title: "StemResult" });

/** Job return value on success. */
export const SeparationCompletedV1 = z
  .object({
    jobId: z.uuid(),
    trackId: z.uuid(),
    durationSeconds: z.number().positive(),
    stems: z.array(StemResult).min(1),
  })
  .meta({ title: "SeparationCompletedV1" });
export type SeparationCompletedV1 = z.infer<typeof SeparationCompletedV1>;

export const SeparationFailureCode = z.enum([
  "separation.invalid_message",
  "separation.input_not_found",
  "separation.invalid_media",
  "separation.duration_exceeded",
  "separation.no_stems",
  "separation.failed",
  "separation.invalid_job_id",
  "separation.invalid_track_id",
  "separation.invalid_object_key",
  "separation.invalid_model",
  "separation.invalid_stem_name",
  "separation.duplicated_stem",
  "separation.invalid_loudness",
  "separation.invalid_peaks",
  "separation.invalid_file_size",
  "separation.invalid_progress",
]).meta({ title: "SeparationFailureCode" });
export type SeparationFailureCode = z.infer<typeof SeparationFailureCode>;

/** JSON-encoded in the BullMQ `failedReason` string. */
export const SeparationFailureV1 = z
  .object({
    code: SeparationFailureCode,
    message: z.string(),
    retryable: z.boolean(),
  })
  .meta({ title: "SeparationFailureV1" });
export type SeparationFailureV1 = z.infer<typeof SeparationFailureV1>;
