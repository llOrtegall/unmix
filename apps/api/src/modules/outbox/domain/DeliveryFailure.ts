import { InvalidDeliveryFailureError } from "./errors/InvalidDeliveryFailureError.ts";

export type DeliveryFailurePrimitive = string;

export class DeliveryFailure {
  private static readonly MAX_LENGTH = 2_000;

  private readonly reason: string;

  private constructor(reason: string) {
    this.reason = reason;
  }

  static create(reason: string): DeliveryFailure {
    DeliveryFailure.ensureIsNotEmpty(reason);
    return new DeliveryFailure(reason.trim().slice(0, DeliveryFailure.MAX_LENGTH));
  }

  static fromError(error: unknown): DeliveryFailure {
    return DeliveryFailure.create(String(error).trim() || "Unknown delivery error");
  }

  static fromPrimitive(data: DeliveryFailurePrimitive): DeliveryFailure {
    return DeliveryFailure.create(data);
  }

  private static ensureIsNotEmpty(reason: string): void {
    if (reason.trim().length === 0) throw new InvalidDeliveryFailureError("the reason is empty");
  }

  equals(other: DeliveryFailure): boolean {
    return this.reason === other.reason;
  }

  toPrimitive(): DeliveryFailurePrimitive {
    return this.reason;
  }
}
