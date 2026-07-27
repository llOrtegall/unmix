import { JobReference, type JobReferencePrimitive } from "./JobReference.ts";
import { StemList, type StemListPrimitive } from "./StemList.ts";
import { TrackSummary, type TrackSummaryPrimitive } from "./TrackSummary.ts";
import { Url, type UrlPrimitive } from "./Url.ts";

export interface TrackPrimitive extends TrackSummaryPrimitive {
  readonly latestJobId: JobReferencePrimitive | null;
  readonly stems: StemListPrimitive;
  readonly archiveUrl: UrlPrimitive;
}

export interface TrackAttributes {
  readonly summary: TrackSummary;
  readonly latestJob: JobReference | null;
  readonly stems: StemList;
  readonly archiveUrl: Url;
}

export class Track {
  private readonly summary: TrackSummary;
  private readonly latestJob: JobReference | null;
  private readonly stems: StemList;
  private readonly archiveUrl: Url;

  private constructor(attributes: TrackAttributes) {
    this.summary = attributes.summary;
    this.latestJob = attributes.latestJob;
    this.stems = attributes.stems;
    this.archiveUrl = attributes.archiveUrl;
  }

  static create(attributes: TrackAttributes): Track {
    return new Track(attributes);
  }

  static fromPrimitive(data: TrackPrimitive): Track {
    const { latestJobId, stems, archiveUrl, ...summary } = data;
    return Track.create({
      summary: TrackSummary.fromPrimitive(summary),
      latestJob: latestJobId === null ? null : JobReference.fromPrimitive(latestJobId),
      stems: StemList.fromPrimitive(stems),
      archiveUrl: Url.fromPrimitive(archiveUrl),
    });
  }

  getSummary(): TrackSummary {
    return this.summary;
  }

  getLatestJob(): JobReference | null {
    return this.latestJob;
  }

  getStems(): StemList {
    return this.stems;
  }

  getArchiveUrl(): Url {
    return this.archiveUrl;
  }

  isReady(): boolean {
    return this.summary.getStatus().isCompleted();
  }

  equals(other: Track): boolean {
    return this.summary.equals(other.summary);
  }

  toPrimitive(): TrackPrimitive {
    return {
      ...this.summary.toPrimitive(),
      latestJobId: this.latestJob?.toPrimitive() ?? null,
      stems: this.stems.toPrimitive(),
      archiveUrl: this.archiveUrl.toPrimitive(),
    };
  }
}
