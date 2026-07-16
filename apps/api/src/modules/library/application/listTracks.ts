import { UserId } from "../../shared/domain/UserId.ts";
import { CreatedAt } from "../domain/CreatedAt.ts";
import { PageSize } from "../domain/PageSize.ts";
import type { TrackPage } from "../domain/TrackPage.ts";
import type { TrackRepository } from "../domain/TrackRepository.ts";

export interface ListTracksInput {
  readonly ownerId: string;
  readonly cursor: string | null;
  readonly limit: number;
}

export const listTracks =
  ({ trackRepository }: { trackRepository: TrackRepository }) =>
  async (input: ListTracksInput): Promise<TrackPage> =>
    trackRepository.findPageByOwner(
      UserId.fromPrimitive(input.ownerId),
      input.cursor === null ? null : CreatedAt.fromPrimitive(input.cursor),
      PageSize.create(input.limit),
    );
