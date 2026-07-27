import { InvalidDurationError } from "./errors/InvalidDurationError.ts";

export type DurationPrimitive = number;

export class Duration {
  private readonly seconds: number;

  private constructor(seconds: number) {
    this.seconds = seconds;
  }

  static create(seconds: number): Duration {
    Duration.ensureIsNotNegative(seconds);
    return new Duration(seconds);
  }

  static fromPrimitive(data: DurationPrimitive): Duration {
    return Duration.create(data);
  }

  private static ensureIsNotNegative(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new InvalidDurationError(seconds);
  }

  equals(other: Duration): boolean {
    return this.seconds === other.seconds;
  }

  toPrimitive(): DurationPrimitive {
    return this.seconds;
  }
}
