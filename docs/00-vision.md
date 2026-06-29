# 00 — Visión y alcance

## Problema

Músicos, productores, profesores y creadores de contenido quieren aislar partes de una canción: quitar la voz para karaoke, practicar con la batería silenciada o samplear un bajo. Las herramientas comerciales cobran por canción. Las herramientas libres exigen terminal y conocimientos técnicos.

## Propuesta

Una web simple donde el usuario:

1. Arrastra un archivo de audio o video.
2. Ve el progreso de la separación en tiempo real.
3. Escucha cada instrumento en un mixer (mute, solo, volumen).
4. Descarga los stems que necesita.
5. Vuelve más tarde a su biblioteca de canciones procesadas.

## Usuario objetivo

Persona no técnica. Toda la complejidad (modelos, colas, formatos) queda oculta. La experiencia debe ser clara, rápida de entender y con mensajes de error comprensibles.

## Alcance de la PoC

- Entrada: audio (mp3, wav, flac, m4a, ogg) y video (mp4, mov, webm, mkv).
- Límite: 10 minutos de duración y 200 MB por archivo.
- Salida: 6 stems — voz, batería, bajo, guitarra, piano, otros.
- Mixer multitrack con reproducción sincronizada.
- Descarga individual (WAV) o todo en ZIP.
- Progreso en vivo.
- Historial de trabajos.
- Login con Google (fase 5).

## Fuera de alcance (por ahora)

- Procesamiento con GPU o en la nube.
- Transcripción a MIDI o partituras.
- Edición de audio (cortes, efectos).
- Pagos, planes o cuotas.
- App móvil nativa.

## Criterios de éxito de la PoC

- Una canción de 4 minutos se procesa de punta a punta sin intervención manual.
- Un usuario no técnico completa el flujo sin ayuda.
- El sistema se recupera de un fallo del worker sin perder el trabajo (reintento).
