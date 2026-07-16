import { MissingStemUrlsError } from "./errors/MissingStemUrlsError.ts";
import { PlayableStemList, type PlayableStemListPrimitive } from "./PlayableStemList.ts";
import { Track, type TrackPrimitive } from "./Track.ts";

export interface PlayableTrackPrimitive {
  readonly track: TrackPrimitive;
  readonly stems: PlayableStemListPrimitive;
}

export class PlayableTrack {
  private readonly track: Track;
  private readonly stems: PlayableStemList;

  private constructor(track: Track, stems: PlayableStemList) {
    this.track = track;
    this.stems = stems;
  }

  static create(track: Track, stems: PlayableStemList): PlayableTrack {
    PlayableTrack.ensureEveryStemIsSigned(track, stems);
    return new PlayableTrack(track, stems);
  }

  static fromPrimitive(data: PlayableTrackPrimitive): PlayableTrack {
    return PlayableTrack.create(Track.fromPrimitive(data.track), PlayableStemList.fromPrimitive(data.stems));
  }

  private static ensureEveryStemIsSigned(track: Track, stems: PlayableStemList): void {
    if (track.getStems().count() !== stems.count()) throw new MissingStemUrlsError(track.getId().toPrimitive());
  }

  getTrack(): Track {
    return this.track;
  }

  equals(other: PlayableTrack): boolean {
    return this.track.equals(other.track) && this.stems.equals(other.stems);
  }

  toPrimitive(): PlayableTrackPrimitive {
    return { track: this.track.toPrimitive(), stems: this.stems.toPrimitive() };
  }
}
