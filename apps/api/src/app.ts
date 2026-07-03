import cors from "@fastify/cors";
import Fastify, { type FastifyServerOptions } from "fastify";
import { type LibraryUseCases, libraryRoutes } from "./modules/library/interface/routes.ts";
import { type SeparationUseCases, separationRoutes } from "./modules/separation/interface/routes.ts";

export interface AppDeps {
  library: LibraryUseCases;
  separation: SeparationUseCases;
  health: () => Promise<Record<string, "ok" | "error">>;
  webOrigin: string;
}

/** HTTP surface only; wiring lives in main.ts so tests can pass fakes. */
export function buildApp(deps: AppDeps, options: FastifyServerOptions = {}) {
  const app = Fastify(options);
  app.register(cors, { origin: deps.webOrigin, methods: ["GET", "POST", "DELETE"] });

  app.setErrorHandler((cause, req, reply) => {
    const error = cause as Error & { statusCode?: number };
    req.log.error({ err: error }, "unhandled error");
    const status = error.statusCode ?? 500;
    const code = status < 500 ? "BAD_REQUEST" : "INTERNAL_ERROR";
    const message = status < 500 ? error.message : "Something went wrong. Please try again.";
    void reply.status(status).send({ error: { code, message } });
  });

  app.get("/health", async (_req, reply) => {
    const checks = await deps.health();
    const healthy = Object.values(checks).every((v) => v === "ok");
    return reply.status(healthy ? 200 : 503).send({ status: healthy ? "ok" : "degraded", checks });
  });

  app.register(
    async (api) => {
      libraryRoutes(api, deps.library);
      separationRoutes(api, deps.separation);
    },
    { prefix: "/api/v1" },
  );
  return app;
}
