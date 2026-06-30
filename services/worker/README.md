# worker

Worker Python que separa stems con Demucs. Gestionado con uv.

- **Fase 1:** spike CLI en `spike/` para medir tiempos en CPU.
- **Fase 2:** consumidor de la cola `separation` (BullMQ), ffmpeg, subida al storage S3.

Ver [ADR 0001](../../docs/adr/0001-modelo-demucs-6s.md) y [ADR 0004](../../docs/adr/0004-cola-redis-bullmq.md).
