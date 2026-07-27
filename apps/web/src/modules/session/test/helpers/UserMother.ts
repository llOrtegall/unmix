import { faker } from "@faker-js/faker";
import { User, type UserPrimitive } from "../../domain/User.ts";

export const createPrimitive = (overrides: Partial<UserPrimitive> = {}): UserPrimitive => ({
  id: faker.string.alphanumeric(32),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  avatarUrl: faker.image.avatar(),
  ...overrides,
});

export const create = (overrides: Partial<UserPrimitive> = {}): User => User.fromPrimitive(createPrimitive(overrides));
