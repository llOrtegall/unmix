import { InvalidCreditError } from "./errors/InvalidCreditError.ts";

export type CreditPrimitive = string;

export class Credit {
  private static readonly MAX_LENGTH = 500;

  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Credit {
    const trimmed = value.trim();
    Credit.ensureIsNotEmpty(trimmed);
    Credit.ensureDoesNotExceedMaxLength(trimmed);
    return new Credit(trimmed);
  }

  static fromPrimitive(data: CreditPrimitive): Credit {
    return Credit.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.length === 0) throw new InvalidCreditError("it is empty");
  }

  private static ensureDoesNotExceedMaxLength(value: string): void {
    if (value.length > Credit.MAX_LENGTH) throw new InvalidCreditError(`it exceeds ${Credit.MAX_LENGTH} characters`);
  }

  equals(other: Credit): boolean {
    return this.value === other.value;
  }

  toPrimitive(): CreditPrimitive {
    return this.value;
  }
}
