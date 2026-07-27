import { faker } from "@faker-js/faker";

export const create = (name = `${faker.word.noun()}.mp3`, type = "audio/mpeg", sizeBytes = 1024): File => {
  const file = new File(["audio"], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
};
