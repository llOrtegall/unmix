// Generates JSON Schema from the zod contracts; the worker turns it into
// pydantic models (see services/worker `make contracts`).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  SeparationCompletedV1,
  SeparationFailureV1,
  SeparationProgressV1,
  SeparationRequestedV1,
} from "../src/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "generated", "json-schema");
mkdirSync(outDir, { recursive: true });

const bundle = z.object({
  requested: SeparationRequestedV1,
  progress: SeparationProgressV1,
  completed: SeparationCompletedV1,
  failure: SeparationFailureV1,
});

const schema = z.toJSONSchema(bundle, { target: "draft-2020-12" });
const file = join(outDir, "separation.v1.json");
writeFileSync(file, JSON.stringify({ title: "SeparationMessagesV1", ...schema }, null, 2) + "\n");
console.log(`wrote ${file}`);
