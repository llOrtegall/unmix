import { FileSize, type FileSizePrimitive } from "./FileSize.ts";
import { StemName, type StemNamePrimitive } from "./StemName.ts";
import { Url, type UrlPrimitive } from "./Url.ts";

export interface StemPrimitive {
  readonly name: StemNamePrimitive;
  readonly downloadUrl: UrlPrimitive;
  readonly previewUrl: UrlPrimitive;
  readonly peaksUrl: UrlPrimitive;
  readonly midiUrl: UrlPrimitive | null;
  readonly sizeBytes: FileSizePrimitive;
  readonly silent: boolean;
}

export interface StemAttributes {
  readonly name: StemName;
  readonly downloadUrl: Url;
  readonly previewUrl: Url;
  readonly peaksUrl: Url;
  readonly midiUrl: Url | null;
  readonly size: FileSize;
  readonly silent: boolean;
}

export class Stem {
  private readonly name: StemName;
  private readonly downloadUrl: Url;
  private readonly previewUrl: Url;
  private readonly peaksUrl: Url;
  private readonly midiUrl: Url | null;
  private readonly size: FileSize;
  private readonly silent: boolean;

  private constructor(attributes: StemAttributes) {
    this.name = attributes.name;
    this.downloadUrl = attributes.downloadUrl;
    this.previewUrl = attributes.previewUrl;
    this.peaksUrl = attributes.peaksUrl;
    this.midiUrl = attributes.midiUrl;
    this.size = attributes.size;
    this.silent = attributes.silent;
  }

  static create(attributes: StemAttributes): Stem {
    return new Stem(attributes);
  }

  static fromPrimitive(data: StemPrimitive): Stem {
    return Stem.create({
      name: StemName.fromPrimitive(data.name),
      downloadUrl: Url.fromPrimitive(data.downloadUrl),
      previewUrl: Url.fromPrimitive(data.previewUrl),
      peaksUrl: Url.fromPrimitive(data.peaksUrl),
      midiUrl: data.midiUrl === null ? null : Url.fromPrimitive(data.midiUrl),
      size: FileSize.fromPrimitive(data.sizeBytes),
      silent: data.silent,
    });
  }

  getName(): StemName {
    return this.name;
  }

  getDownloadUrl(): Url {
    return this.downloadUrl;
  }

  getPreviewUrl(): Url {
    return this.previewUrl;
  }

  getPeaksUrl(): Url {
    return this.peaksUrl;
  }

  getMidiUrl(): Url | null {
    return this.midiUrl;
  }

  getSize(): FileSize {
    return this.size;
  }

  isSilent(): boolean {
    return this.silent;
  }

  hasMidi(): boolean {
    return this.midiUrl !== null;
  }

  equals(other: Stem): boolean {
    return this.name.equals(other.name) && this.downloadUrl.equals(other.downloadUrl);
  }

  toPrimitive(): StemPrimitive {
    return {
      name: this.name.toPrimitive(),
      downloadUrl: this.downloadUrl.toPrimitive(),
      previewUrl: this.previewUrl.toPrimitive(),
      peaksUrl: this.peaksUrl.toPrimitive(),
      midiUrl: this.midiUrl?.toPrimitive() ?? null,
      sizeBytes: this.size.toPrimitive(),
      silent: this.silent,
    };
  }
}
