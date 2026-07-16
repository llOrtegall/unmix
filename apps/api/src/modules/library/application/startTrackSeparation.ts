import { JobId } from "../../shared/domain/JobId.ts";
import type { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findExistingTrack } from "./findExistingTrack.ts";

export interface StartTrackSeparationInput {
  readonly trackId: string;
  readonly jobId: string;
}

export const startTrackSeparation = ({ trackRepository }: { trackRepository: TrackRepository }) => {
  const findExisting = findExistingTrack({ trackRepository });

  return async (input: StartTrackSeparationInput): Promise<Track> => {
    const track = (await findExisting(input.trackId)).startSeparation(JobId.fromPrimitive(input.jobId));
    await trackRepository.save(track);
    return track;
  };
};
