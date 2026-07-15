import { faker } from "@faker-js/faker";
import { ObjectKey, type ObjectKeyPrimitive } from "../../domain/ObjectKey.ts";

export const createPrimitive = (): ObjectKeyPrimitive => `${faker.system.directoryPath().slice(1)}/${faker.system.fileName()}`;

export const create = (value: ObjectKeyPrimitive = createPrimitive()): ObjectKey => ObjectKey.fromPrimitive(value);
