import { ArchiveEntry } from "./ArchiveEntry.ts";
import { ArchiveEntryList, type ArchiveEntryListPrimitive } from "./ArchiveEntryList.ts";
import type { Stem } from "./Stem.ts";
import type { Track } from "./Track.ts";
import { TrackTitle, type TrackTitlePrimitive } from "./TrackTitle.ts";

export interface StemArchivePrimitive {
  readonly title: TrackTitlePrimitive;
  readonly entries: ArchiveEntryListPrimitive;
}

export class StemArchive {
  private readonly title: TrackTitle;
  private readonly entries: ArchiveEntryList;

  private constructor(title: TrackTitle, entries: ArchiveEntryList) {
    this.title = title;
    this.entries = entries;
  }

  static create(title: TrackTitle, entries: ArchiveEntryList): StemArchive {
    return new StemArchive(title, entries);
  }

  static forTrack(track: Track): StemArchive {
    track.ensureStemsAreReady();
    return StemArchive.create(track.getTitle(), ArchiveEntryList.create(track.getStems().map(StemArchive.entriesFor).flat()));
  }

  static fromPrimitive(data: StemArchivePrimitive): StemArchive {
    return StemArchive.create(TrackTitle.fromPrimitive(data.title), ArchiveEntryList.fromPrimitive(data.entries));
  }

  private static entriesFor(stem: Stem): ArchiveEntry[] {
    const name = stem.getName().toPrimitive();
    const audio = ArchiveEntry.create(`${name}.flac`, stem.getKey());
    const midiKey = stem.getMidiKey();
    return midiKey ? [audio, ArchiveEntry.create(`midi/${name}.mid`, midiKey)] : [audio];
  }

  getFilename(): string {
    return `${this.title.toPrimitive()} - stems.zip`;
  }

  getEntries(): ArchiveEntryList {
    return this.entries;
  }

  equals(other: StemArchive): boolean {
    return this.title.equals(other.title) && this.entries.equals(other.entries);
  }

  toPrimitive(): StemArchivePrimitive {
    return { title: this.title.toPrimitive(), entries: this.entries.toPrimitive() };
  }
}
