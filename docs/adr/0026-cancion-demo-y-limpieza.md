# 0026 — Canción demo por usuario, limpieza de basura y e2e de navegador

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

En la fase 6 se pide una canción demo precargada, limpieza automática de archivos antiguos, tests e2e con Playwright y una demo grabada para el cliente. Las bibliotecas son privadas por usuario ([ADR 0025](0025-sesiones-y-propiedad.md)).

## Decisión

- **Canción:** "La" de Shane Ivers, con licencia CC BY 4.0 (`assets/demo/`). Cubre los seis stems. El crédito exigido por la licencia se guarda en `tracks.credit` y la UI lo muestra con una insignia "Demo".
- **Copia por usuario, archivos compartidos.** `pnpm --filter @unmix/api demo:seed` separa la canción una sola vez con la pila en marcha, copia sus archivos a `demo/` y escribe `demo/manifest.json`. Cada usuario nuevo recibe una fila `Track` completada (`Track.fromDemo`) que apunta a esos archivos, mediante el hook `user.create.after` de Better Auth. No se copian los ~100 MB por usuario. Borrar la demo solo elimina `tracks/<id>/`, nunca `demo/`. El script también se la da a los usuarios que ya existían.
- **Limpieza solo de basura.** Cada hora, y al arrancar, `CollectGarbage` borra las subidas sin terminar de más de 24 h y las carpetas `tracks/<uuid>/` de S3 sin fila en la base. Las canciones del usuario no caducan.
- **E2E de navegador.** `@playwright/test` contra la pila Docker, en escritorio y móvil. Los usuarios se crean con `apps/api/scripts/test-user.ts` (sesión escrita en Postgres, sin pasar por Google) y se borran al terminar. La prueba con Demucs real va etiquetada `@slow` y solo corre en escritorio. No corre en CI porque necesita la pila completa.
- **Demo grabada.** `pnpm --filter @unmix/web demo:record` recorre el flujo con Playwright y lo graba. ffmpeg recorta la espera de la separación y deja un MP4 sin audio en `apps/web/demo-recording/`.

## Consecuencias

- Un entorno nuevo necesita `demo:seed` una vez. Sin él, los usuarios empiezan con la biblioteca vacía (el hook no falla).
- Los archivos de `demo/` no tienen dueño y la limpieza no los toca.
- El video no tiene audio, porque Playwright no lo graba. Para una presentación con sonido hay que grabar la pantalla a mano.
