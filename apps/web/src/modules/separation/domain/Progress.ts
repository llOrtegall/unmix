import { InvalidProgressError } from "./errors/InvalidProgressError.ts";

const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

export type ProgressPrimitive = number;

export class Progress {
  private readonly percent: number;

  private constructor(percent: number) {
    this.percent = percent;
  }

  static create(percent: number): Progress {
    Progress.ensureIsPercentage(percent);
    return new Progress(percent);
  }

  static fromPrimitive(data: ProgressPrimitive): Progress {
    return Progress.create(data);
  }

  private static ensureIsPercentage(percent: number): void {
    if (!Number.isInteger(percent) || percent < MIN_PERCENT || percent > MAX_PERCENT) throw new InvalidProgressError(percent);
  }

  equals(other: Progress): boolean {
    return this.percent === other.percent;
  }

  toPrimitive(): ProgressPrimitive {
    return this.percent;
  }
}
