import { faker } from "@faker-js/faker";
import { UserId, type UserIdPrimitive } from "../../domain/UserId.ts";

export const createPrimitive = (): UserIdPrimitive => faker.string.uuid();

export const create = (value: UserIdPrimitive = createPrimitive()): UserId => UserId.fromPrimitive(value);

export const invalidPrimitive = (): UserIdPrimitive => faker.lorem.word();
