import type { FastifyBaseLogger } from "fastify";
import type { LibraryModule } from "../modules/library/application/factory.ts";

const COLLECT_INTERVAL_MS = 3_600_000;

export const collectGarbageJob = (library: LibraryModule, log: FastifyBaseLogger): (() => void) => {
  const collect = () =>
    library.collectGarbage().then(
      (report) => log.info(report, "garbage collected"),
      (error: unknown) => log.error({ err: error }, "garbage collection failed"),
    );

  void collect();
  const timer = setInterval(() => void collect(), COLLECT_INTERVAL_MS);
  return () => clearInterval(timer);
};
