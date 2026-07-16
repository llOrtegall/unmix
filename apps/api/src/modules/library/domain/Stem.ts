import { ObjectKey, type ObjectKeyPrimitive } from "../../shared/domain/ObjectKey.ts";
import { FileSize, type FileSizePrimitive } from "./FileSize.ts";
import { StemName, type StemNamePrimitive } from "./StemName.ts";
import type { TrackTitle } from "./TrackTitle.ts";

export interface StemPrimitive {
  readonly name: StemNamePrimitive;
  readonly key: ObjectKeyPrimitive;
  readonly sizeBytes: FileSizePrimitive;
  readonly silent: boolean;
  readonly previewKey: ObjectKeyPrimitive;
  readonly peaksKey: ObjectKeyPrimitive;
  readonly midiKey: ObjectKeyPrimitive | null;
}

export interface StemAttributes {
  readonly name: StemName;
  readonly key: ObjectKey;
  readonly size: FileSize;
  readonly silent: boolean;
  readonly previewKey: ObjectKey;
  readonly peaksKey: ObjectKey;
  readonly midiKey: ObjectKey | null;
}

export class Stem {
  private readonly name: StemName;
  private readonly key: ObjectKey;
  private readonly size: FileSize;
  private readonly silent: boolean;
  private readonly previewKey: ObjectKey;
  private readonly peaksKey: ObjectKey;
  private readonly midiKey: ObjectKey | null;

  private constructor(attributes: StemAttributes) {
    this.name = attributes.name;
    this.key = attributes.key;
    this.size = attributes.size;
    this.silent = attributes.silent;
    this.previewKey = attributes.previewKey;
    this.peaksKey = attributes.peaksKey;
    this.midiKey = attributes.midiKey;
  }

  static create(attributes: StemAttributes): Stem {
    return new Stem(attributes);
  }

  static fromPrimitive(data: StemPrimitive): Stem {
    return Stem.create({
      name: StemName.fromPrimitive(data.name),
      key: ObjectKey.fromPrimitive(data.key),
      size: FileSize.fromPrimitive(data.sizeBytes),
      silent: data.silent,
      previewKey: ObjectKey.fromPrimitive(data.previewKey),
      peaksKey: ObjectKey.fromPrimitive(data.peaksKey),
      midiKey: data.midiKey === null ? null : ObjectKey.fromPrimitive(data.midiKey),
    });
  }

  getName(): StemName {
    return this.name;
  }

  getKey(): ObjectKey {
    return this.key;
  }

  getPreviewKey(): ObjectKey {
    return this.previewKey;
  }

  getPeaksKey(): ObjectKey {
    return this.peaksKey;
  }

  getMidiKey(): ObjectKey | null {
    return this.midiKey;
  }

  isSilent(): boolean {
    return this.silent;
  }

  downloadFilename(title: TrackTitle): string {
    return `${title.toPrimitive()} - ${this.name.toPrimitive()}.flac`;
  }

  midiFilename(title: TrackTitle): string {
    return `${title.toPrimitive()} - ${this.name.toPrimitive()}.mid`;
  }

  equals(other: Stem): boolean {
    return (
      this.name.equals(other.name) &&
      this.key.equals(other.key) &&
      this.size.equals(other.size) &&
      this.silent === other.silent &&
      this.previewKey.equals(other.previewKey) &&
      this.peaksKey.equals(other.peaksKey) &&
      (this.midiKey === null ? other.midiKey === null : other.midiKey !== null && this.midiKey.equals(other.midiKey))
    );
  }

  toPrimitive(): StemPrimitive {
    return {
      name: this.name.toPrimitive(),
      key: this.key.toPrimitive(),
      sizeBytes: this.size.toPrimitive(),
      silent: this.silent,
      previewKey: this.previewKey.toPrimitive(),
      peaksKey: this.peaksKey.toPrimitive(),
      midiKey: this.midiKey?.toPrimitive() ?? null,
    };
  }
}
