# 0008 — Entrada: audio y video, máximo 10 minutos

- **Estado:** Aceptada
- **Fecha:** 2026-10-27

## Contexto

Los usuarios pueden tener la canción como video. En CPU, archivos largos bloquean el worker durante mucho tiempo.

## Decisión

Aceptar audio (mp3, wav, flac, m4a, ogg) y video (mp4, mov, webm, mkv). ffmpeg extrae y normaliza a WAV estéreo 44.1 kHz. Límites: 10 minutos y 200 MB, configurables.

## Consecuencias

- Validación en dos puntos: cliente (tamaño y tipo) y worker (duración real con ffprobe).
- Mensaje claro al usuario cuando se excede un límite.
