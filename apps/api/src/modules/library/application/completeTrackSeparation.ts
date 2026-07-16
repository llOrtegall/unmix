import { JobId } from "../../shared/domain/JobId.ts";
import { StemList, type StemListPrimitive } from "../domain/StemList.ts";
import type { Track } from "../domain/Track.ts";
import { TrackDuration } from "../domain/TrackDuration.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";
import { findExistingTrack } from "./findExistingTrack.ts";

export interface CompleteTrackSeparationInput {
  readonly trackId: string;
  readonly jobId: string;
  readonly durationSeconds: number;
  readonly stems: StemListPrimitive;
}

export const completeTrackSeparation = ({ trackRepository }: { trackRepository: TrackRepository }) => {
  const findExisting = findExistingTrack({ trackRepository });

  return async (input: CompleteTrackSeparationInput): Promise<Track> => {
    const track = (await findExisting(input.trackId)).completeSeparation({
      jobId: JobId.fromPrimitive(input.jobId),
      duration: TrackDuration.create(input.durationSeconds),
      stems: StemList.fromPrimitive(input.stems),
    });
    await trackRepository.save(track);
    return track;
  };
};
