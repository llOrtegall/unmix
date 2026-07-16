import { ObjectKey, type ObjectKeyPrimitive } from "../../shared/domain/ObjectKey.ts";
import { Credit, type CreditPrimitive } from "./Credit.ts";
import { InvalidDemoSongError } from "./errors/InvalidDemoSongError.ts";
import { FileSize, type FileSizePrimitive } from "./FileSize.ts";
import { MediaType, type MediaTypePrimitive } from "./MediaType.ts";
import { OriginalFilename, type OriginalFilenamePrimitive } from "./OriginalFilename.ts";
import { StemList, type StemListPrimitive } from "./StemList.ts";
import { TrackDuration, type TrackDurationPrimitive } from "./TrackDuration.ts";
import { TrackTitle, type TrackTitlePrimitive } from "./TrackTitle.ts";

export interface DemoSongPrimitive {
  readonly title: TrackTitlePrimitive;
  readonly originalFilename: OriginalFilenamePrimitive;
  readonly contentType: MediaTypePrimitive;
  readonly sizeBytes: FileSizePrimitive;
  readonly inputKey: ObjectKeyPrimitive;
  readonly durationSeconds: TrackDurationPrimitive;
  readonly credit: CreditPrimitive;
  readonly stems: StemListPrimitive;
}

export interface DemoSongAttributes {
  readonly title: TrackTitle;
  readonly originalFilename: OriginalFilename;
  readonly mediaType: MediaType;
  readonly size: FileSize;
  readonly inputKey: ObjectKey;
  readonly duration: TrackDuration;
  readonly credit: Credit;
  readonly stems: StemList;
}

export class DemoSong {
  private readonly title: TrackTitle;
  private readonly originalFilename: OriginalFilename;
  private readonly mediaType: MediaType;
  private readonly size: FileSize;
  private readonly inputKey: ObjectKey;
  private readonly duration: TrackDuration;
  private readonly credit: Credit;
  private readonly stems: StemList;

  private constructor(attributes: DemoSongAttributes) {
    this.title = attributes.title;
    this.originalFilename = attributes.originalFilename;
    this.mediaType = attributes.mediaType;
    this.size = attributes.size;
    this.inputKey = attributes.inputKey;
    this.duration = attributes.duration;
    this.credit = attributes.credit;
    this.stems = attributes.stems;
  }

  static create(attributes: DemoSongAttributes): DemoSong {
    DemoSong.ensureHasStems(attributes.stems);
    return new DemoSong(attributes);
  }

  static fromPrimitive(data: DemoSongPrimitive): DemoSong {
    return DemoSong.create({
      title: TrackTitle.fromPrimitive(data.title),
      originalFilename: OriginalFilename.fromPrimitive(data.originalFilename),
      mediaType: MediaType.fromPrimitive(data.contentType),
      size: FileSize.fromPrimitive(data.sizeBytes),
      inputKey: ObjectKey.fromPrimitive(data.inputKey),
      duration: TrackDuration.fromPrimitive(data.durationSeconds),
      credit: Credit.fromPrimitive(data.credit),
      stems: StemList.fromPrimitive(data.stems),
    });
  }

  private static ensureHasStems(stems: StemList): void {
    if (stems.isEmpty()) throw new InvalidDemoSongError("it has no stems");
  }

  getTitle(): TrackTitle {
    return this.title;
  }

  getOriginalFilename(): OriginalFilename {
    return this.originalFilename;
  }

  getMediaType(): MediaType {
    return this.mediaType;
  }

  getSize(): FileSize {
    return this.size;
  }

  getInputKey(): ObjectKey {
    return this.inputKey;
  }

  getDuration(): TrackDuration {
    return this.duration;
  }

  getCredit(): Credit {
    return this.credit;
  }

  getStems(): StemList {
    return this.stems;
  }

  equals(other: DemoSong): boolean {
    return (
      this.title.equals(other.title) &&
      this.inputKey.equals(other.inputKey) &&
      this.credit.equals(other.credit) &&
      this.stems.equals(other.stems)
    );
  }

  toPrimitive(): DemoSongPrimitive {
    return {
      title: this.title.toPrimitive(),
      originalFilename: this.originalFilename.toPrimitive(),
      contentType: this.mediaType.toPrimitive(),
      sizeBytes: this.size.toPrimitive(),
      inputKey: this.inputKey.toPrimitive(),
      durationSeconds: this.duration.toPrimitive(),
      credit: this.credit.toPrimitive(),
      stems: this.stems.toPrimitive(),
    };
  }
}
