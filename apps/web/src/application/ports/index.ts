import type { Job } from "../../domain/job.ts";
import type { StemName } from "../../domain/stem.ts";
import type { Track, TrackPage } from "../../domain/track.ts";

/** Business error from the API, or a network failure (`NETWORK_ERROR`). */
export interface AppError {
  code: string;
  message: string;
}

export type Outcome<T> = { ok: true; value: T } | { ok: false; error: AppError };

export interface TrackGateway {
  createUpload(input: { filename: string; contentType: string; sizeBytes: number }): Promise<Outcome<{ trackId: string; uploadUrl: string }>>;
  requestSeparation(trackId: string): Promise<Outcome<Job>>;
  getTrack(trackId: string): Promise<Outcome<Track>>;
  listTracks(cursor?: string): Promise<Outcome<TrackPage>>;
  deleteTrack(trackId: string): Promise<Outcome<void>>;
  getJob(jobId: string): Promise<Outcome<Job>>;
  zipUrl(trackId: string): string;
}

export interface UploadGateway {
  put(url: string, file: Blob, contentType: string, onProgress: (fraction: number) => void, signal?: AbortSignal): Promise<Outcome<void>>;
}

export interface JobEventsGateway {
  /** Calls `onUpdate` with every change until the job finishes; returns an unsubscribe function. */
  watch(jobId: string, onUpdate: (job: Job) => void, onError: (error: AppError) => void): () => void;
}

export interface PeaksGateway {
  load(url: string): Promise<number[]>;
}

export interface AudioEngine {
  load(stems: { name: StemName; url: string }[]): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  setGain(name: StemName, gain: number): void;
  readonly duration: number;
  readonly currentTime: number;
  onEnded(listener: () => void): () => void;
  dispose(): void;
}
