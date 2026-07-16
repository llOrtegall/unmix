import { UserId } from "../../shared/domain/UserId.ts";
import { TrackId } from "../domain/TrackId.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

export const checkTrackOwnership =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  async (trackId: string, userId: string): Promise<boolean> => {
    const track = await trackRepository.findById(TrackId.fromPrimitive(trackId));
    return track?.isOwnedBy(UserId.fromPrimitive(userId)) ?? false;
  };
