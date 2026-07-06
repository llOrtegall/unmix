# 0023 — Previsualización MP3, picos de onda y reproducción con `<audio>`

- **Estado:** Aceptada
- **Fecha:** 2026-10-27
- **Reemplaza:** wavesurfer.js de [0005](0005-frontend-react-vite.md) y [0017](0017-frontend-clean-zustand.md); completa la fase 4 de [0020](0020-stems-flac-y-silencio.md)

## Contexto

Decodificar en el navegador 6 stems FLAC de 5 minutos con Web Audio ocupa unos 630 MB de RAM (PCM float32 estéreo). Además, wavesurfer.js decodifica el archivo completo para dibujar la onda.

## Decisión

- Por cada stem, el worker genera además:
  - `{stem}.preview.mp3`: MP3 128 kbps (unos 4.7 MB para 5 minutos).
  - `{stem}.peaks.json`: `{ "version": 1, "peaks": number[] }`, 1000 valores de 0 a 1 (unos 6 KB).
- El contrato `StemResult` incluye `previewKey` y `peaksKey`. La API devuelve `previewUrl` y `peaksUrl` firmadas.
- El navegador reproduce cada stem con su propio `<audio>` en streaming. `HtmlAudioEngine` alinea todos al primero: cada 250 ms corrige la deriva si supera 40 ms.
- La onda se dibuja en `<canvas>` a partir del JSON de picos, con la misma escala para todas las pistas.
- El storage S3 tiene CORS para el origen web (`s3-init`): el navegador sube con PUT firmado y descarga picos y previsualizaciones.

## Consecuencias

- Memoria baja en el navegador y reproducción inmediata; la descarga FLAC sin pérdida sigue disponible.
- El volumen va de 0 a 100 % (`HTMLMediaElement.volume`); en iOS ese control no está disponible.
- La sincronización es buena para escuchar, no para edición precisa a nivel de muestra. Si hace falta, migrar el adapter `AudioEngine` a Web Audio con buffers decodificados por tramos, sin tocar el resto.
- Codificar las previsualizaciones suma unos 16 s por canción en el worker.
