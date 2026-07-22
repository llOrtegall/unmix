import { faker } from "@faker-js/faker";
import { describe, expect, it } from "vitest";
import { UnexpectedEventTypeError } from "../../../shared/domain/errors/UnexpectedEventTypeError.ts";
import * as UserIdMother from "../../../shared/test/helpers/UserIdMother.ts";
import { UserRegistered, type UserRegisteredPrimitive } from "../../domain/UserRegistered.ts";

const primitive = (overrides: Partial<UserRegisteredPrimitive> = {}): UserRegisteredPrimitive => ({
  id: faker.string.uuid(),
  type: UserRegistered.TYPE,
  occurredAt: faker.date.recent().toISOString(),
  payload: { userId: UserIdMother.createPrimitive() },
  ...overrides,
});

describe("UserRegistered", () => {
  it("survives a primitive round-trip", () => {
    const data = primitive();

    expect(UserRegistered.fromPrimitive(data).toPrimitive()).toEqual(data);
  });

  it("records the new user", () => {
    const userId = UserIdMother.create();

    expect(UserRegistered.occur(userId).toPrimitive()).toMatchObject({ type: UserRegistered.TYPE, payload: { userId: userId.toPrimitive() } });
  });

  it("rejects data of another event", () => {
    expect(() => UserRegistered.fromPrimitive(primitive({ type: "separation.requested" }))).toThrow(UnexpectedEventTypeError);
  });
});
