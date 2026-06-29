# 0003 — Backend: API Node + worker Python

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Demucs es PyTorch, por lo que la separación debe ejecutarse en Python. El equipo prefiere TypeScript para la API y el frontend.

## Decisión

API en Node.js + TypeScript con Fastify, Drizzle ORM y zod. Worker separado en Python, gestionado con uv.

## Consecuencias

- Tipos compartidos entre Web y API en `packages/shared`.
- Dos lenguajes: el contrato del job debe mantenerse sincronizado (zod en TS, pydantic en Python).
- La API y el worker escalan de forma independiente.
