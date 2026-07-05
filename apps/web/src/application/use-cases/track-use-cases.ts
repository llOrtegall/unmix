import { isFinished, type Job } from "../../domain/job.ts";
import { sortStems, type StemName } from "../../domain/stem.ts";
import type { Track } from "../../domain/track.ts";
import type { AppError, JobEventsGateway, Outcome, PeaksGateway, TrackGateway } from "../ports/index.ts";

export interface LoadedTrack {
  track: Track;
  peaks: Partial<Record<StemName, number[]>>;
}

export class LoadTrack {
  #tracks: TrackGateway;
  #peaks: PeaksGateway;

  constructor(deps: { tracks: TrackGateway; peaks: PeaksGateway }) {
    this.#tracks = deps.tracks;
    this.#peaks = deps.peaks;
  }

  async execute(trackId: string): Promise<Outcome<LoadedTrack>> {
    const result = await this.#tracks.getTrack(trackId);
    if (!result.ok) return result;
    const track = { ...result.value, stems: sortStems(result.value.stems) };
    // Waveforms are decoration: a missing peaks file must not block playback.
    const entries = await Promise.all(
      track.stems.map(async (s) => [s.name, await this.#peaks.load(s.peaksUrl).catch(() => [])] as const),
    );
    return { ok: true, value: { track, peaks: Object.fromEntries(entries) } };
  }
}

/**
 * Follows a job live. Starts from the current state so a page reload or a
 * finished job still reports correctly.
 */
export class WatchJob {
  #tracks: TrackGateway;
  #events: JobEventsGateway;

  constructor(deps: { tracks: TrackGateway; events: JobEventsGateway }) {
    this.#tracks = deps.tracks;
    this.#events = deps.events;
  }

  execute(jobId: string, onUpdate: (job: Job) => void, onError: (error: AppError) => void): () => void {
    let stop: (() => void) | null = null;
    let cancelled = false;
    void this.#tracks.getJob(jobId).then((current) => {
      if (cancelled) return;
      if (!current.ok) return onError(current.error);
      onUpdate(current.value);
      if (!isFinished(current.value)) stop = this.#events.watch(jobId, onUpdate, onError);
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }
}

export class RetrySeparation {
  #tracks: TrackGateway;

  constructor(deps: { tracks: TrackGateway }) {
    this.#tracks = deps.tracks;
  }

  execute(trackId: string): Promise<Outcome<Job>> {
    return this.#tracks.requestSeparation(trackId);
  }
}
