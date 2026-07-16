import { CreatedAt, type CreatedAtPrimitive } from "./CreatedAt.ts";
import { TrackList, type TrackListPrimitive } from "./TrackList.ts";

export interface TrackPagePrimitive {
  readonly tracks: TrackListPrimitive;
  readonly nextCursor: CreatedAtPrimitive | null;
}

export class TrackPage {
  private readonly tracks: TrackList;
  private readonly nextCursor: CreatedAt | null;

  private constructor(tracks: TrackList, nextCursor: CreatedAt | null) {
    this.tracks = tracks;
    this.nextCursor = nextCursor;
  }

  static create(tracks: TrackList, nextCursor: CreatedAt | null): TrackPage {
    return new TrackPage(tracks, nextCursor);
  }

  static lastPage(tracks: TrackList): TrackPage {
    return TrackPage.create(tracks, null);
  }

  static fromPrimitive(data: TrackPagePrimitive): TrackPage {
    return TrackPage.create(
      TrackList.fromPrimitive(data.tracks),
      data.nextCursor === null ? null : CreatedAt.fromPrimitive(data.nextCursor),
    );
  }

  getTracks(): TrackList {
    return this.tracks;
  }

  hasMore(): boolean {
    return this.nextCursor !== null;
  }

  equals(other: TrackPage): boolean {
    const sameCursor =
      this.nextCursor === null ? other.nextCursor === null : other.nextCursor !== null && this.nextCursor.equals(other.nextCursor);
    return sameCursor && this.tracks.equals(other.tracks);
  }

  toPrimitive(): TrackPagePrimitive {
    return { tracks: this.tracks.toPrimitive(), nextCursor: this.nextCursor?.toPrimitive() ?? null };
  }
}
