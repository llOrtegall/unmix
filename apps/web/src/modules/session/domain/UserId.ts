import { InvalidUserIdError } from "./errors/InvalidUserIdError.ts";

export type UserIdPrimitive = string;

export class UserId {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): UserId {
    UserId.ensureIsNotEmpty(value);
    return new UserId(value);
  }

  static fromPrimitive(data: UserIdPrimitive): UserId {
    return UserId.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.trim().length === 0) throw new InvalidUserIdError();
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toPrimitive(): UserIdPrimitive {
    return this.value;
  }
}
