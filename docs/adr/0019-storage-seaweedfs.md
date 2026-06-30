# 0019 — Storage S3 local: SeaweedFS en lugar de MinIO

- **Estado:** Aceptada
- **Fecha:** 2026-10-27
- **Reemplaza:** motor de storage de [0006](0006-storage-postgres-minio.md)

## Contexto

Al levantar la infraestructura (fase 0), las imágenes `minio/minio` y `minio/mc` ya no se pueden descargar: Docker Hub responde `pull access denied` y quay.io `401 UNAUTHORIZED`. MinIO dejó de distribuir imágenes libres. Alternativas evaluadas, todas descargables: SeaweedFS (Apache-2.0, madura), RustFS (Apache-2.0, joven, consola similar a MinIO) y Garage (AGPL-3.0, configuración más compleja).

## Decisión

Usar SeaweedFS (`chrislusf/seaweedfs`, versión fijada) como storage compatible con S3 en local. Servicio `s3` en Docker Compose, expuesto en `localhost:9000`. Credenciales de desarrollo en `infra/seaweedfs/s3.json`. El bucket lo crea `s3-init` con `aws-cli`.

## Consecuencias

- Licencia Apache-2.0, sin restricciones para el cliente.
- Ningún cambio en código: todo usa el port `ObjectStorage` y el protocolo S3. Producción puede usar AWS S3 o Cloudflare R2.
- No hay consola web; el bucket se inspecciona con `aws-cli`.
- Las credenciales del JSON deben coincidir con `S3_ACCESS_KEY` y `S3_SECRET_KEY` de `.env`.
