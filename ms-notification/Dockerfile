FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Puerto HTTP para /health y registro en Eureka
# El listener de Redis Pub/Sub se inicia automáticamente vía lifespan de FastAPI
EXPOSE 3004

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3004"]
