import { Track } from "../domain/Track.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

export const removeAbandonedUploads =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  async (): Promise<number> => {
    const abandoned = await trackRepository.findAwaitingUploadCreatedBefore(Track.abandonedUploadCutoff());
    await Promise.all(abandoned.map((track) => trackRepository.delete(track.getId())));
    return abandoned.count();
  };
