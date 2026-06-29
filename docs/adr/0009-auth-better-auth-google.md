# 0009 — Auth: Better Auth + Google (fase 5)

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

El historial debe ser privado por usuario. Se busca una solución gratuita con login de Google sencillo. Auth.js es conocido por el equipo, pero está muy ligado a Next.js, y su mantenimiento pasó al equipo de Better Auth.

## Decisión

Diferir la autenticación a la fase 5. Usar Better Auth (open source, gratuito) con proveedor Google, integrado en Fastify y en el cliente React. Alternativa aceptable: `@auth/express` si se prefiere Auth.js.

## Consecuencias

- Fases 1–4 funcionan sin login; `tracks.user_id` es nullable hasta entonces.
- Better Auth crea sus propias tablas en Postgres.
- Requiere credenciales OAuth en Google Cloud Console.
