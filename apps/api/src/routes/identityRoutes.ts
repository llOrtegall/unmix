import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { IdentityModule } from "../modules/identity/application/factory.ts";

const toHeaders = (request: FastifyRequest): Headers => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
};

const toFetchRequest = (request: FastifyRequest): Request => {
  const url = new URL(request.url, `${request.protocol}://${request.host}`);
  const body = request.method === "GET" || request.body === undefined ? undefined : JSON.stringify(request.body);
  return new Request(url, { method: request.method, headers: toHeaders(request), body });
};

export const identityRoutes =
  (identity: IdentityModule): FastifyPluginAsync =>
  async (app) => {
    app.route({
      method: ["GET", "POST"],
      url: "/api/auth/*",
      handler: async (request, reply) => {
        const response = await identity.handleAuthRequest(toFetchRequest(request));
        reply.status(response.status);
        for (const [name, value] of response.headers) {
          if (name !== "set-cookie") reply.header(name, value);
        }
        // Several cookies folded into one Set-Cookie header would break; they go out as a list.
        const cookies = response.headers.getSetCookie();
        if (cookies.length > 0) reply.header("set-cookie", cookies);
        return reply.send(response.body ? Buffer.from(await response.arrayBuffer()) : null);
      },
    });
  };
