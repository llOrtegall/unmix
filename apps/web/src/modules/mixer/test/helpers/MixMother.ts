import { StemName, type StemNamePrimitive } from "../../../track/domain/StemName.ts";
import { Mix } from "../../domain/Mix.ts";

export const create = (names: readonly StemNamePrimitive[] = ["vocals", "drums", "bass", "guitar", "piano", "other"]): Mix =>
  Mix.forStems(names.map((name) => StemName.create(name)));
