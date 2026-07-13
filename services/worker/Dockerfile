# Build stage: resolve the venv with uv and bake the model weights.
FROM python:3.12-slim-bookworm AS build

COPY --from=ghcr.io/astral-sh/uv:0.13.6 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    TORCH_HOME=/opt/torch

WORKDIR /app

# Dependencies first so code changes do not reinstall torch.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project \
    # Test suite and C++ headers are never used at runtime (~140 MB).
    && rm -rf /opt/venv/lib/python3.12/site-packages/torch/test \
              /opt/venv/lib/python3.12/site-packages/torch/include

COPY src ./src
RUN uv sync --frozen --no-dev

# Bake model weights into the image so the first job does not download them.
ARG DEMUCS_MODEL=htdemucs_6s
RUN /opt/venv/bin/python -c "from demucs.pretrained import get_model; get_model('${DEMUCS_MODEL}')"

# Runtime: no uv, no package cache, a static ffmpeg instead of Debian's (~330 MB less).
FROM python:3.12-slim-bookworm

COPY --from=mwader/static-ffmpeg:7.1.1 /ffmpeg /usr/local/bin/ffmpeg
COPY --from=build /opt/venv /opt/venv
COPY --from=build /opt/torch /opt/torch
COPY --from=build /app/src /app/src

# numba (used by librosa for Basic Pitch) caches compiled code next to the sources by
# default, which the non-root user cannot write.
ENV PATH="/opt/venv/bin:$PATH" \
    TORCH_HOME=/opt/torch \
    NUMBA_CACHE_DIR=/tmp/numba

WORKDIR /app
RUN useradd --system --uid 1001 worker
USER worker

CMD ["python", "-m", "unmix_worker.main"]
