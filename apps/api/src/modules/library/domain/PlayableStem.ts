import { SignedUrl, type SignedUrlPrimitive } from "./SignedUrl.ts";
import { Stem, type StemPrimitive } from "./Stem.ts";

export interface PlayableStemPrimitive {
  readonly stem: StemPrimitive;
  readonly downloadUrl: SignedUrlPrimitive;
  readonly previewUrl: SignedUrlPrimitive;
  readonly peaksUrl: SignedUrlPrimitive;
  readonly midiUrl: SignedUrlPrimitive | null;
}

export interface PlayableStemAttributes {
  readonly stem: Stem;
  readonly downloadUrl: SignedUrl;
  readonly previewUrl: SignedUrl;
  readonly peaksUrl: SignedUrl;
  readonly midiUrl: SignedUrl | null;
}

export class PlayableStem {
  private readonly stem: Stem;
  private readonly downloadUrl: SignedUrl;
  private readonly previewUrl: SignedUrl;
  private readonly peaksUrl: SignedUrl;
  private readonly midiUrl: SignedUrl | null;

  private constructor(attributes: PlayableStemAttributes) {
    this.stem = attributes.stem;
    this.downloadUrl = attributes.downloadUrl;
    this.previewUrl = attributes.previewUrl;
    this.peaksUrl = attributes.peaksUrl;
    this.midiUrl = attributes.midiUrl;
  }

  static create(attributes: PlayableStemAttributes): PlayableStem {
    return new PlayableStem(attributes);
  }

  static fromPrimitive(data: PlayableStemPrimitive): PlayableStem {
    return PlayableStem.create({
      stem: Stem.fromPrimitive(data.stem),
      downloadUrl: SignedUrl.fromPrimitive(data.downloadUrl),
      previewUrl: SignedUrl.fromPrimitive(data.previewUrl),
      peaksUrl: SignedUrl.fromPrimitive(data.peaksUrl),
      midiUrl: data.midiUrl === null ? null : SignedUrl.fromPrimitive(data.midiUrl),
    });
  }

  getStem(): Stem {
    return this.stem;
  }

  equals(other: PlayableStem): boolean {
    return this.stem.equals(other.stem) && this.downloadUrl.equals(other.downloadUrl);
  }

  toPrimitive(): PlayableStemPrimitive {
    return {
      stem: this.stem.toPrimitive(),
      downloadUrl: this.downloadUrl.toPrimitive(),
      previewUrl: this.previewUrl.toPrimitive(),
      peaksUrl: this.peaksUrl.toPrimitive(),
      midiUrl: this.midiUrl?.toPrimitive() ?? null,
    };
  }
}
