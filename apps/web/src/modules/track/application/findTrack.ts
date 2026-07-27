import { TrackNotFoundError } from "../domain/errors/TrackNotFoundError.ts";
import type { PeaksRepository } from "../domain/PeaksRepository.ts";
import type { Track } from "../domain/Track.ts";
import { TrackId } from "../domain/TrackId.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import type { Waveforms } from "../domain/Waveforms.ts";

export interface FoundTrack {
  readonly track: Track;
  readonly waveforms: Waveforms;
}

export const findTrack =
  ({ trackRepository, peaksRepository }: { trackRepository: TrackRepository; peaksRepository: PeaksRepository }) =>
  async (id: string): Promise<FoundTrack> => {
    const track = await trackRepository.findById(TrackId.fromPrimitive(id));
    if (!track) throw new TrackNotFoundError(id);
    return { track, waveforms: await peaksRepository.findForStems(track.getStems()) };
  };
