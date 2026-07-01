FROM python:3.12-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.13.6 /uv /bin/uv

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    TORCH_HOME=/opt/torch

WORKDIR /app

# Dependencies first so code changes do not reinstall torch.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

# Bake model weights into the image so the first job does not download them.
ARG DEMUCS_MODEL=htdemucs_6s
RUN python -c "from demucs.pretrained import get_model; get_model('${DEMUCS_MODEL}')"

RUN useradd --system --uid 1001 worker
USER worker

CMD ["python", "-m", "unmix_worker.main"]
