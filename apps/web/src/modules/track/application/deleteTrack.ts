import { TrackId } from "../domain/TrackId.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

export const deleteTrack =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  (id: string): Promise<void> =>
    trackRepository.delete(TrackId.fromPrimitive(id));
