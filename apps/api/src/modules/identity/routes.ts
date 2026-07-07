import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Identity } from "./index.ts";

declare module "fastify" {
  interface FastifyRequest {
    /** Set by `requireUser` on every protected route. */
    userId: string;
  }
}

export function toHeaders(req: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(name, v);
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
}

/** Bridges Fastify to Better Auth's fetch handler. */
export function identityRoutes(app: FastifyInstance, identity: Identity): void {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    handler: async (req, reply) => {
      const url = new URL(req.url, `${req.protocol}://${req.host}`);
      const body = req.method === "GET" || req.body === undefined ? undefined : JSON.stringify(req.body);
      const response = await identity.handler(new Request(url, { method: req.method, headers: toHeaders(req), body }));
      reply.status(response.status);
      for (const [name, value] of response.headers) {
        if (name !== "set-cookie") reply.header(name, value);
      }
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) reply.header("set-cookie", cookies);
      return reply.send(response.body ? Buffer.from(await response.arrayBuffer()) : null);
    },
  });
}

/** preHandler for /api/v1: 401 without a session, otherwise sets `req.userId`. */
export function requireUser(identity: Identity) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = await identity.currentUserId(toHeaders(req));
    if (!userId) {
      return reply.status(401).send({ error: { code: "UNAUTHORIZED", message: "Sign in to continue." } });
    }
    req.userId = userId;
  };
}
