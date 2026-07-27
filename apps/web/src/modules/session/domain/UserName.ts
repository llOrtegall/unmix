import { InvalidUserNameError } from "./errors/InvalidUserNameError.ts";

export type UserNamePrimitive = string;

export class UserName {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): UserName {
    const trimmed = value.trim();
    UserName.ensureIsNotEmpty(trimmed);
    return new UserName(trimmed);
  }

  static fromPrimitive(data: UserNamePrimitive): UserName {
    return UserName.create(data);
  }

  private static ensureIsNotEmpty(value: string): void {
    if (value.length === 0) throw new InvalidUserNameError();
  }

  initial(): string {
    return [...this.value][0]?.toUpperCase() ?? "";
  }

  equals(other: UserName): boolean {
    return this.value === other.value;
  }

  toPrimitive(): UserNamePrimitive {
    return this.value;
  }
}
