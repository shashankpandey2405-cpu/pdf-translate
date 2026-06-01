FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Railway build context = repo root (see railway.translate.toml)
COPY docker/translate-mt/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY docker/translate-mt/download_models.py docker/translate-mt/main.py ./
RUN python download_models.py

ENV ARGOS_SKIP_MODEL_DOWNLOAD=1
EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
