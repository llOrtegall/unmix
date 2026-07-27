import { PageCursor } from "../domain/PageCursor.ts";
import type { TrackPage } from "../domain/TrackPage.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

export const listTracks =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  (cursor: string | null = null): Promise<TrackPage> =>
    trackRepository.list(cursor === null ? null : PageCursor.fromPrimitive(cursor));
