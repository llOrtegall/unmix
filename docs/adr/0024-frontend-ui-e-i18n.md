# 0024 — Frontend: estudio oscuro, shadcn/ui, Tailwind v4 e i18n propio

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

La interfaz debe ser agradable para un cliente no técnico, accesible y en español e inglés, manteniendo el bundle ligero.

## Decisión

- Tema oscuro tipo estudio. Un color de acento por stem (`--stem-*` en OKLCH), usado en onda, slider y solo.
- Tailwind CSS v4 con tokens en `presentation/styles.css`.
- Componentes shadcn/ui copiados al proyecto (`presentation/components/ui`), sobre el paquete `radix-ui`.
- i18n propio y mínimo: diccionarios `es` y `en` tipados (`MessageKey`), hook `useT` y locale persistido con Zustand. El idioma inicial sigue al navegador.
- Router `wouter` (dos rutas: `/` y `/tracks/:id`).
- En Docker, nginx sirve el build y hace de proxy de `/api` (sin buffer para SSE), así el navegador no necesita CORS para la API.

## Consecuencias

- Sin dependencias de i18n ni de router pesadas. Añadir un idioma = un diccionario más; TypeScript obliga a traducir todas las claves.
- Los componentes de UI son código propio: se pueden modificar sin depender de una librería externa.
- `pnpm dev` y el contenedor `web` usan el mismo puerto (5173) y el mismo origen; se ejecuta uno u otro.
