import type {
  SeparationCompleted,
  SeparationFailed,
  SeparationRequested,
} from "../../../separation/index.ts";
import type { Result } from "../../../../shared/kernel/result.ts";
import type { LibraryError } from "../../domain/errors.ts";
import type { TrackRepository } from "../ports/index.ts";

/** Keeps track status in sync with separation jobs. Runs inside the publisher's transaction. */
export class SeparationEventHandlers {
  #tracks: TrackRepository;

  constructor(deps: { tracks: TrackRepository }) {
    this.#tracks = deps.tracks;
  }

  onRequested = async (event: SeparationRequested): Promise<void> => {
    const track = await this.#require(event.payload.trackId);
    orThrow(track.startSeparation(event.payload.jobId));
    await this.#tracks.save(track);
  };

  onCompleted = async (event: SeparationCompleted): Promise<void> => {
    const { jobId, trackId, durationSeconds, stems } = event.payload;
    const track = await this.#require(trackId);
    orThrow(track.completeSeparation(jobId, durationSeconds, stems));
    await this.#tracks.save(track);
  };

  onFailed = async (event: SeparationFailed): Promise<void> => {
    const track = await this.#require(event.payload.trackId);
    track.failSeparation(event.payload.jobId);
    await this.#tracks.save(track);
  };

  async #require(trackId: string) {
    const track = await this.#tracks.findById(trackId);
    if (!track) throw new Error(`Track ${trackId} not found while handling a separation event`);
    return track;
  }
}

// An invariant broken while reacting to an event aborts the whole transaction.
function orThrow(result: Result<void, LibraryError>): void {
  if (result.isErr()) throw new Error(`${result.error.code}: ${result.error.message}`);
}
