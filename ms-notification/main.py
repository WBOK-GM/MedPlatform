import redis
import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)


def blocking_redis_listener():
    """
    Listener bloqueante que corre en un hilo separado (asyncio.to_thread).
    redis-py síncrono blocking_get_message es seguro desde un hilo no-asyncio.
    """
    pubsub = r.pubsub()
    pubsub.subscribe(['appointment:created', 'appointment:cancelled'])
    print("Listening to Redis channels: appointment:created, appointment:cancelled")
    for message in pubsub.listen():
        if message and message['type'] == 'message':
            print(f"[Redis] Channel={message['channel']} Data={message['data']}")
            handle_notification(message['channel'], json.loads(message['data']))


def handle_notification(channel: str, data: dict):
    if channel == 'appointment:created':
        patient_id = data.get('patient_id', 'N/A')
        appointment_id = data.get('appointment_id', 'N/A')
        print(f"[US-026] ENVIAR EMAIL de confirmación al paciente {patient_id} para cita {appointment_id}")
        print(f"[US-027] NOTIFICAR al médico {data.get('doctor_id', 'N/A')} de nueva cita")
    elif channel == 'appointment:cancelled':
        print(f"[US-026] ENVIAR EMAIL de cancelación para cita {data.get('appointment_id', 'N/A')}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Nuevo mecanismo de startup/shutdown de FastAPI (sustituye @app.on_event).
    El listener de Redis corre en un thread pool para no bloquear el event loop.
    """
    asyncio.get_event_loop().run_in_executor(None, blocking_redis_listener)
    yield
    # Cleanup si fuera necesario


app = FastAPI(
    title="Notification Microservice",
    description="Servicio de notificaciones vía Redis Pub/Sub",
    lifespan=lifespan
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
