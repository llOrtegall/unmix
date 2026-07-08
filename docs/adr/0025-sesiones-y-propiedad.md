# 0025 — Sesiones, propiedad de tracks y migración de datos previos

- **Estado:** Aceptada
- **Fecha:** 2026-10-27
- **Complementa:** [0009](0009-auth-better-auth-google.md)

## Contexto

La fase 5 agrega login con Google y bibliotecas privadas. Hay que decidir dónde vive la sesión, cómo se comprueba la propiedad de tracks y jobs, y qué pasa con las pistas creadas antes del login (`user_id = null`).

## Decisión

- **Mismo origen.** Better Auth se monta en la API bajo `/api/auth`, y el navegador llega por el proxy del web (Vite en dev, nginx en Docker). La cookie de sesión es de primera parte y no hace falta CORS con credenciales. `BETTER_AUTH_URL` es el origen público (por defecto `WEB_ORIGIN`). La redirect URI de Google es `<origen>/api/auth/callback/google`.
- **Solo con sesión.** Un `preHandler` en `/api/v1/*` responde `401 UNAUTHORIZED` sin sesión válida y deja `req.userId` para las rutas. No hay uso anónimo.
- **Ids UUID.** Las tablas de Better Auth (`users`, `sessions`, `accounts`, `verifications`) usan `uuid` con `gen_random_uuid()` (`advanced.database.generateId: "uuid"`). Así `tracks.user_id` es una FK a `users.id` (`on delete cascade`, `not null`).
- **Propiedad en el dominio.** `Track` tiene `ownerId`. Los use cases de library reciben el usuario y tratan el track ajeno como inexistente (`404 TRACK_NOT_FOUND`), así no se filtra qué ids existen. Un job pertenece al dueño de su track: separation pregunta con `TrackCatalog.isOwnedBy` (implementado por `CheckTrackOwnership`, API pública de library). El SSE usa la misma comprobación.
- **Datos previos.** Las pistas sin dueño se borraron por la API antes de migrar (eso elimina también sus archivos en S3). La migración `0002_auth` borra las filas sin dueño que queden, y sus jobs, antes de poner `NOT NULL`.
- **Identity sin capas DDD.** `modules/identity` expone una interfaz `Identity` (`handler`, `currentUserId`) y la tabla `users` para FKs. El resto de la API no conoce Better Auth.
- **Web.** Puerto `SessionGateway` con un adaptador sobre el cliente vanilla de Better Auth. Un 401 de la API cierra la sesión en la UI.
- **E2E.** El script de la API crea sesiones de prueba escribiendo directo en Postgres y firmando la cookie con `BETTER_AUTH_SECRET`, sin pasar por Google. Comprueba que un segundo usuario recibe 404 en todo.

## Consecuencias

- Para arrancar la API hacen falta `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
- La app de Google en modo *Testing* solo admite a los usuarios de prueba que se registren en la consola.
- Comprobar la propiedad de un job cuesta una consulta extra por petición. Es aceptable a esta escala.
