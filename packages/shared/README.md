# shared

Contratos compartidos entre `web` y `api`: schemas zod de requests, responses y payload del job.

El worker replica el payload del job con pydantic. Cualquier cambio aquí debe reflejarse en `services/worker`.
