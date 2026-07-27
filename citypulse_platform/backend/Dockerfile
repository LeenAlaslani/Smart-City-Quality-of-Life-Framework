# CityPulse AI — inference backend (FastAPI + the 4 real joblib models).
FROM python:3.11-slim

# OpenMP runtime required by LightGBM (transportation model).
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code + the trained model bundles (backend/models/*.joblib).
COPY app ./app
COPY models ./models

EXPOSE 8000
# Render provides $PORT; default to 8000 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
