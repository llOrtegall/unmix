import { InvalidUploadProgressError } from "./errors/InvalidUploadProgressError.ts";

const PHASES = ["uploading", "requesting"] as const;
const PERCENT = 100;

export interface UploadProgressPrimitive {
  readonly phase: (typeof PHASES)[number];
  readonly fraction: number;
}

export class UploadProgress {
  private readonly phase: UploadProgressPrimitive["phase"];
  private readonly fraction: number;

  private constructor(phase: UploadProgressPrimitive["phase"], fraction: number) {
    this.phase = phase;
    this.fraction = fraction;
  }

  static create(phase: UploadProgressPrimitive["phase"], fraction: number): UploadProgress {
    UploadProgress.ensureIsFraction(fraction);
    return new UploadProgress(phase, fraction);
  }

  static uploading(fraction: number): UploadProgress {
    return UploadProgress.create("uploading", fraction);
  }

  static requesting(): UploadProgress {
    return UploadProgress.create("requesting", 1);
  }

  static fromPrimitive(data: UploadProgressPrimitive): UploadProgress {
    return UploadProgress.create(data.phase, data.fraction);
  }

  private static ensureIsFraction(fraction: number): void {
    if (!(fraction >= 0 && fraction <= 1)) throw new InvalidUploadProgressError(fraction);
  }

  isRequesting(): boolean {
    return this.phase === "requesting";
  }

  percent(): number {
    return Math.round(this.fraction * PERCENT);
  }

  equals(other: UploadProgress): boolean {
    return this.phase === other.phase && this.fraction === other.fraction;
  }

  toPrimitive(): UploadProgressPrimitive {
    return { phase: this.phase, fraction: this.fraction };
  }
}
