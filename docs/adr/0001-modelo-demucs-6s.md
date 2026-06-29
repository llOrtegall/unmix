# 0001 — Modelo de separación: Demucs htdemucs_6s

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Necesitamos separar música en instrumentos con una herramienta de uso libre. Opciones evaluadas: Spleeter (abandonado, menor calidad), Demucs v4 (Meta, MIT), modelos MDX/RoFormer (excelentes en voz, licencias y pesos variados), APIs comerciales (coste por uso).

## Decisión

Usar Demucs v4 con el modelo `htdemucs_6s`: voz, batería, bajo, guitarra, piano y otros. Código y pesos bajo licencia MIT.

## Consecuencias

- Uso comercial permitido.
- Más stems que el estándar de 4, pero el stem de piano tiene calidad irregular. Comunicarlo al cliente.
- El nombre del modelo es configurable (`DEMUCS_MODEL`) para cambiar a `htdemucs_ft` (4 stems, mayor calidad) sin tocar código.
