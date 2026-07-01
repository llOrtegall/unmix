# Spike — Demucs htdemucs_6s en CPU (fase 1)

- **Fecha:** 2026-10-27
- **Script:** [`services/worker/spike/spike.py`](../services/worker/spike/spike.py)
- **Máquina:** WSL2, 16 hilos lógicos, 15 GB RAM, sin GPU
- **Software:** Python 3.12, torch 2.8.0+cpu, torchaudio 2.8.0, demucs 4.0.1

## Entrada

`thecure.mp3`: MP3 estéreo 44.1 kHz, 4:57 (297 s), 12 MB, con portada incrustada (stream `mjpeg`). ffmpeg descartó la portada al normalizar (`-vn`) sin errores.

## Resultados

| Métrica | Valor |
|---------|-------|
| Normalización ffmpeg → WAV | 1.4 s |
| Carga del modelo (primera vez, incluye descarga de pesos) | 10.3 s |
| **Separación** | **84 s** |
| **Factor de tiempo real** | **0.28** (≈ 17 s de proceso por minuto de canción) |
| Pico de RAM | 2.2 GB |
| Hilos de torch | 8 |
| Salida | 6 WAV de 50 MB (≈ 300 MB por canción) |

**Criterio de aceptación (canción de 4 min < ~15 min): cumplido con amplio margen.** Una canción de 10 minutos (límite de entrada) tardaría ≈ 3 minutos.

## Energía por stem

| Stem | RMS vs mezcla |
|------|---------------|
| vocals | −7.0 dB |
| guitar | −8.0 dB |
| bass | −9.5 dB |
| other | −10.8 dB |
| drums | −13.2 dB |
| piano | −27.7 dB |

Residuo de reconstrucción (mezcla − suma de stems): −16.2 dB.

## Observaciones

- El stem de **piano** queda casi vacío en esta canción (−27.7 dB). Es esperable si no hay piano; los teclados/sintetizadores caen en `other`. Confirma la advertencia de [ADR 0001](adr/0001-modelo-demucs-6s.md): en la UI hay que detectar stems casi silenciosos y mostrarlos atenuados o como "sin contenido".
- El residuo de −16 dB indica que la suma de stems no reconstruye exactamente la mezcla. Es normal en `htdemucs_6s`; vigilar si se ofrece un "remix" exportado.
- torch usa 8 hilos por defecto (núcleos físicos). Con un solo worker por máquina no conviene subirlo; con varios workers, repartir hilos (`torch.set_num_threads`).
- torchaudio 2.8 avisa que en 2.9 cambia el backend de guardado. **Acción para fase 2:** el adapter de Demucs guarda los stems con `soundfile` en lugar de `torchaudio.save`, para poder actualizar torch sin romper nada.
- 300 MB de WAV por canción: considerar FLAC (≈ 50 % menos, sin pérdida) para almacenamiento y MP3/OGG para la previsualización en el mixer.
- Calidad percibida: **pendiente de escucha** por el usuario.

## Decisión

Seguir con `htdemucs_6s` en CPU. No hace falta GPU para la PoC.
