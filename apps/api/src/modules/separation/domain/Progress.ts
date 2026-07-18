import { InvalidProgressError } from "./errors/InvalidProgressError.ts";

export type ProgressPrimitive = number;

export class Progress {
  private static readonly NONE = 0;
  private static readonly FULL = 100;

  private readonly percentage: number;

  private constructor(percentage: number) {
    this.percentage = percentage;
  }

  static create(percentage: number): Progress {
    Progress.ensureIsAPercentage(percentage);
    return new Progress(percentage);
  }

  static none(): Progress {
    return Progress.create(Progress.NONE);
  }

  static full(): Progress {
    return Progress.create(Progress.FULL);
  }

  static fromPrimitive(data: ProgressPrimitive): Progress {
    return Progress.create(data);
  }

  private static ensureIsAPercentage(percentage: number): void {
    if (!Number.isInteger(percentage) || percentage < Progress.NONE || percentage > Progress.FULL) {
      throw new InvalidProgressError(percentage);
    }
  }

  equals(other: Progress): boolean {
    return this.percentage === other.percentage;
  }

  toPrimitive(): ProgressPrimitive {
    return this.percentage;
  }
}
