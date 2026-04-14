import redis
import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import py_eureka_client.eureka_client as eureka_client
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
 
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL, decode_responses=True)


def send_email(to_email: str, subject: str, body: str):
    message = Mail(
        from_email="rellenoa10@gmail.com", # Reemplaza con un correo verificado en SendGrid
        to_emails=to_email,
        subject=subject,
        plain_text_content=body
    )
    try:
        # Busca la clave en las variables de entorno
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
        response = sg.send(message)
        print(f"Email enviado a {to_email} con código {response.status_code}")
    except Exception as e:
        print(f"Error enviando email vía SendGrid: {e}")

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
        patient_id   = data.get('patient_id', 'N/A')
        appointment_id = data.get('appointment_id', 'N/A')
        patient_email  = data.get('patient_email', '')
        doctor_id      = data.get('doctor_id', 'N/A')
        doctor_email   = data.get('doctor_email', '')
        care_type      = data.get('type', '')
        # Referencia corta legible (primeros 8 caracteres del UUID)
        ref = appointment_id[:8].upper() if appointment_id != 'N/A' else 'N/A'

        care_label = {'IN_PERSON': 'Presencial', 'VIRTUAL': 'Virtual', 'HYBRID': 'Híbrida'}.get(care_type, care_type)

        print(f"[US-026] ENVIAR EMAIL de confirmación al paciente {patient_id} — ref #{ref}")

        # --- Correo al paciente ---
        if patient_email:
            subject = f"Tu cita médica ha sido confirmada — Ref. #{ref}"
            body = (
                f"¡Tu cita ha sido confirmada!\n\n"
                f"  • Número de referencia : #{ref}\n"
                f"  • Tipo de atención     : {care_label}\n\n"
                f"Recibirás recordatorios próximos a la fecha.\n\n"
                f"Si necesitas cancelar o reprogramar, ingresa a la plataforma.\n\n"
                f"— Equipo MedPlatform"
            )
            send_email(patient_email, subject, body)

        # --- Correo al médico (US-027) ---
        print(f"[US-027] NOTIFICAR al médico {doctor_id} de nueva cita — ref #{ref}")
        if doctor_email:
            subject = f"Nueva cita agendada — Ref. #{ref}"
            body = (
                f"Tienes una nueva cita agendada.\n\n"
                f"  • Número de referencia : #{ref}\n"
                f"  • Tipo de atención     : {care_label}\n\n"
                f"Revisa tu calendario en la plataforma para ver todos los detalles.\n\n"
                f"— Equipo MedPlatform"
            )
            send_email(doctor_email, subject, body)

    elif channel == 'appointment:cancelled':
        appointment_id = data.get('appointment_id', 'N/A')
        patient_email  = data.get('patient_email', '')
        ref = appointment_id[:8].upper() if appointment_id != 'N/A' else 'N/A'
        print(f"[US-026] ENVIAR EMAIL de cancelación — ref #{ref}")

        if patient_email:
            subject = f"Tu cita ha sido cancelada — Ref. #{ref}"
            body = (
                f"Tu cita con referencia #{ref} ha sido cancelada.\n\n"
                f"Si tienes dudas, contáctanos a través de la plataforma.\n\n"
                f"— Equipo MedPlatform"
            )
            send_email(patient_email, subject, body)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Nuevo mecanismo de startup/shutdown de FastAPI (sustituye @app.on_event).
    El listener de Redis corre en un thread pool para no bloquear el event loop.
    """
    eureka_server = os.getenv("EUREKA_SERVER", "http://ms-eureka:8761/eureka")
    await eureka_client.init_async(eureka_server=eureka_server, app_name="ms-notification", instance_port=3004)
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

