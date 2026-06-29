# 0002 — Cómputo: CPU local, worker intercambiable

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

No hay GPU disponible en el entorno de desarrollo (WSL2 sin CUDA). Los proveedores de GPU cloud añaden coste y dependencia externa en una PoC.

## Decisión

Ejecutar Demucs en CPU local. El worker solo depende de la cola y de S3, sin acoplarse a la API.

## Consecuencias

- Coste cero.
- Procesamiento lento (aprox. 1x–3x la duración). El progreso en vivo es obligatorio.
- Migrar a GPU (local o Modal/RunPod/Replicate) implica reemplazar solo el worker.
