import { JobId } from "../../shared/domain/JobId.ts";
import type { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findExistingTrack } from "./findExistingTrack.ts";

export interface FailTrackSeparationInput {
  readonly trackId: string;
  readonly jobId: string;
}

export const failTrackSeparation = ({ trackRepository }: { trackRepository: TrackRepository }) => {
  const findExisting = findExistingTrack({ trackRepository });

  return async (input: FailTrackSeparationInput): Promise<Track> => {
    const track = (await findExisting(input.trackId)).failSeparation(JobId.fromPrimitive(input.jobId));
    await trackRepository.save(track);
    return track;
  };
};
