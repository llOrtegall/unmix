import cors from "@fastify/cors";
import Fastify, { type FastifyServerOptions } from "fastify";
import type { Identity } from "./modules/identity/index.ts";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.ts";
import { requireUser } from "./middlewares/requireUser.ts";
import { identityRoutes } from "./modules/identity/routes.ts";
import type { LibraryModule } from "./modules/library/application/factory.ts";
import { type SeparationUseCases, separationRoutes } from "./modules/separation/interface/routes.ts";
import { libraryRoutes } from "./routes/libraryRoutes.ts";

export interface AppDeps {
  library: LibraryModule;
  separation: SeparationUseCases;
  identity: Identity;
  health: () => Promise<Record<string, "ok" | "error">>;
  webOrigin: string;
}

/** HTTP surface only; wiring lives in main.ts so tests can pass fakes. */
export function buildApp(deps: AppDeps, options: FastifyServerOptions = {}) {
  const app = Fastify(options);
  app.register(cors, { origin: deps.webOrigin, methods: ["GET", "POST", "DELETE"] });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.get("/health", async (_req, reply) => {
    const checks = await deps.health();
    const healthy = Object.values(checks).every((v) => v === "ok");
    return reply.status(healthy ? 200 : 503).send({ status: healthy ? "ok" : "degraded", checks });
  });

  identityRoutes(app, deps.identity);

  app.register(
    async (api) => {
      api.addHook("preHandler", requireUser(deps.identity));
      await api.register(libraryRoutes(deps.library));
      separationRoutes(api, deps.separation);
    },
    { prefix: "/api/v1" },
  );
  return app;
}
