# 0007 — Infra: Docker Compose

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

El sistema tiene seis servicios. Necesitamos un entorno reproducible para desarrollo y para demos al cliente.

## Decisión

Docker Compose orquesta postgres, redis, minio, api, worker y web.

## Consecuencias

- Un comando levanta todo.
- Requiere instalar Docker en WSL (fase 0).
- La imagen del worker es pesada (PyTorch); usar caché de capas y precargar el modelo en build.
