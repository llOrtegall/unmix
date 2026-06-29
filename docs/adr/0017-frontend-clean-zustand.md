# 0017 — Frontend: Clean Architecture + Zustand

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

El frontend tiene lógica propia (mixer, sincronización de stems, estados de subida y progreso) y depende de librerías que pueden cambiar (wavesurfer, transporte HTTP/SSE). Complementa [ADR 0005](0005-frontend-react-vite.md).

## Decisión

Clean Architecture completa en `apps/web`: `domain` (modelos, reglas del mixer), `application` (use cases + ports: `TrackGateway`, `JobEventsGateway`, `AudioEngine`, `UploadGateway`), `infrastructure` (fetch, EventSource, wavesurfer/Web Audio, S3 presigned) y `presentation` (React). Estado de cliente con Zustand (librería mínima, ~1 KB). TanStack Query es opcional para caché de datos del servidor y solo vive en `presentation`.

## Consecuencias

- React y Zustand quedan en el borde; el dominio es TypeScript puro y testeable sin DOM.
- Reemplaza la mención a TanStack Query como pieza obligatoria de ADR 0005.
- Más boilerplate que una estructura por features.
