import { PageCursor, type PageCursorPrimitive } from "./PageCursor.ts";
import { TrackList, type TrackListPrimitive } from "./TrackList.ts";

export interface TrackPagePrimitive {
  readonly tracks: TrackListPrimitive;
  readonly nextCursor: PageCursorPrimitive | null;
}

export class TrackPage {
  private readonly tracks: TrackList;
  private readonly nextCursor: PageCursor | null;

  private constructor(tracks: TrackList, nextCursor: PageCursor | null) {
    this.tracks = tracks;
    this.nextCursor = nextCursor;
  }

  static create(tracks: TrackList, nextCursor: PageCursor | null): TrackPage {
    return new TrackPage(tracks, nextCursor);
  }

  static fromPrimitive(data: TrackPagePrimitive): TrackPage {
    return TrackPage.create(
      TrackList.fromPrimitive(data.tracks),
      data.nextCursor === null ? null : PageCursor.fromPrimitive(data.nextCursor),
    );
  }

  getTracks(): TrackList {
    return this.tracks;
  }

  getNextCursor(): PageCursor | null {
    return this.nextCursor;
  }

  hasMore(): boolean {
    return this.nextCursor !== null;
  }

  equals(other: TrackPage): boolean {
    const sameCursor = this.nextCursor === null ? other.nextCursor === null : other.nextCursor !== null && this.nextCursor.equals(other.nextCursor);
    return sameCursor && this.tracks.equals(other.tracks);
  }

  toPrimitive(): TrackPagePrimitive {
    return { tracks: this.tracks.toPrimitive(), nextCursor: this.nextCursor?.toPrimitive() ?? null };
  }
}
