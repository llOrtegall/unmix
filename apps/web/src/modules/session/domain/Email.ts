import { InvalidEmailError } from "./errors/InvalidEmailError.ts";

const FORMAT = /^[^\s@]+@[^\s@]+$/;

export type EmailPrimitive = string;

export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();
    Email.ensureFormatIsValid(normalized);
    return new Email(normalized);
  }

  static fromPrimitive(data: EmailPrimitive): Email {
    return Email.create(data);
  }

  private static ensureFormatIsValid(value: string): void {
    if (!FORMAT.test(value)) throw new InvalidEmailError(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toPrimitive(): EmailPrimitive {
    return this.value;
  }
}
