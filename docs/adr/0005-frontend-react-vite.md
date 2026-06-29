# 0005 — Frontend: React + Vite + TypeScript

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

La app es muy interactiva (mixer de audio) y no necesita SSR ni SEO.

## Decisión

SPA con React + Vite + TypeScript. wavesurfer.js para waveforms, Web Audio API para la mezcla sincronizada, TanStack Query para datos del servidor.

## Consecuencias

- Desarrollo rápido y build simple.
- Si el producto crece y necesita páginas públicas o SEO, evaluar migración a un framework con SSR.
