# 0006 — Persistencia: Postgres + MinIO

- **Estado:** Aceptada. Motor de storage reemplazado por [0019](0019-storage-seaweedfs.md)
- **Fecha:** 2026-10-27

## Contexto

Hay que guardar metadatos (tracks, jobs, stems) y archivos de audio grandes (un stem WAV de 4 minutos ocupa ~40 MB).

## Decisión

PostgreSQL para metadatos. MinIO (compatible con S3) para archivos. El navegador sube y descarga con URLs firmadas.

## Consecuencias

- Migrar a AWS S3 o Cloudflare R2 solo cambia variables de entorno.
- La API nunca transmite audio, salvo el ZIP en streaming.
- Necesitamos política de limpieza de archivos antiguos (fase 6).
