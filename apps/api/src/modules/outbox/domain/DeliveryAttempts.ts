import { InvalidDeliveryAttemptsError } from "./errors/InvalidDeliveryAttemptsError.ts";

export type DeliveryAttemptsPrimitive = number;

export class DeliveryAttempts {
  private readonly count: number;

  private constructor(count: number) {
    this.count = count;
  }

  static create(count: number): DeliveryAttempts {
    DeliveryAttempts.ensureIsANonNegativeInteger(count);
    return new DeliveryAttempts(count);
  }

  static none(): DeliveryAttempts {
    return DeliveryAttempts.create(0);
  }

  static fromPrimitive(data: DeliveryAttemptsPrimitive): DeliveryAttempts {
    return DeliveryAttempts.create(data);
  }

  private static ensureIsANonNegativeInteger(count: number): void {
    if (!Number.isInteger(count) || count < 0) throw new InvalidDeliveryAttemptsError(count);
  }

  increment(): DeliveryAttempts {
    return DeliveryAttempts.create(this.count + 1);
  }

  equals(other: DeliveryAttempts): boolean {
    return this.count === other.count;
  }

  toPrimitive(): DeliveryAttemptsPrimitive {
    return this.count;
  }
}
