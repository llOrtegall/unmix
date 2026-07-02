# 0020 — Stems en FLAC y detección de stems silenciosos

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

El spike ([spike-demucs.md](../spike-demucs.md)) mostró que los 6 stems en WAV ocupan unos 300 MB por canción y que un stem puede quedar casi vacío (piano a −27.7 dB respecto a la mezcla en una canción sin piano).

## Decisión

- El worker guarda cada stem como FLAC 16-bit (sin pérdida). En la canción de prueba: 98 MB en total, un 67 % menos que en WAV.
- El worker marca `silent: true` cuando el RMS del stem queda más de 24 dB por debajo del de la mezcla. La regla vive en el dominio del worker (`SILENCE_THRESHOLD_DB`).
- Los audios de previsualización para el mixer (MP3/OGG) se decidirán en la fase 4.

## Consecuencias

- Menos almacenamiento y transferencia sin perder calidad.
- La UI puede atenuar u ocultar stems sin contenido.
- El umbral es heurístico; ajustarlo con más canciones de prueba.
