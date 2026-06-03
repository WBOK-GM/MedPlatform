import asyncio
import json
import os
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from pydantic import BaseModel
from kafka import KafkaConsumer
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPICS = ["appointment-events", "auth-events"]


def send_email(to_email: str, subject: str, body: str):
    message = Mail(
        from_email="rellenoa10@gmail.com",
        to_emails=to_email,
        subject=subject,
        plain_text_content=body,
    )
    try:
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
        response = sg.send(message)
        print(f"Email enviado a {to_email} con código {response.status_code}")
    except Exception as e:
        print(f"Error enviando email vía SendGrid: {e}")


def blocking_kafka_listener():
    """
    Consumer Kafka bloqueante que corre en hilo separado (run_in_executor).
    Consume appointment-events y auth-events; despacha por eventName del envelope.
    group_id fijo garantiza at-least-once y permite escalar réplicas sin duplicados.
    """
    consumer = KafkaConsumer(
        *TOPICS,
        bootstrap_servers=KAFKA_BOOTSTRAP.split(","),
        group_id="ms-notification",
        enable_auto_commit=True,
        # 'latest': solo mensajes nuevos al arrancar; 'earliest' reprocesaría histórico
        auto_offset_reset="latest",
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
    )
    print(f"[Kafka] Escuchando topics: {TOPICS}")
    for msg in consumer:
        try:
            envelope = msg.value
            event_name = envelope.get("eventName", "")
            data = envelope.get("data", {})
            print(f"[Kafka] topic={msg.topic} event={event_name} key={msg.key}")
            handle_notification(event_name, data)
        except Exception as e:
            print(f"[Kafka] Error procesando mensaje: {e}")


def handle_notification(event_name: str, data: dict):
    if event_name == "appointment.created":
        patient_id = data.get("patient_id", "N/A")
        appointment_id = data.get("appointment_id", "N/A")
        patient_email = data.get("patient_email", "")
        doctor_id = data.get("doctor_id", "N/A")
        doctor_email = data.get("doctor_email", "")
        care_type = data.get("type", "")

        ref = appointment_id[:8].upper() if appointment_id != "N/A" else "N/A"
        care_label = {
            "IN_PERSON": "Presencial",
            "VIRTUAL": "Virtual",
            "HYBRID": "Híbrida",
        }.get(care_type, care_type)

        print(f"[US-026] ENVIAR EMAIL de confirmación al paciente {patient_id} — ref #{ref}")

        if patient_email:
            send_email(
                patient_email,
                f"Tu cita médica ha sido confirmada — Ref. #{ref}",
                (
                    f"¡Tu cita ha sido confirmada!\n\n"
                    f"  • Número de referencia : #{ref}\n"
                    f"  • Tipo de atención     : {care_label}\n\n"
                    f"Recibirás recordatorios próximos a la fecha.\n\n"
                    f"Si necesitas cancelar o reprogramar, ingresa a la plataforma.\n\n"
                    f"— Equipo MedPlatform"
                ),
            )

        print(f"[US-027] NOTIFICAR al médico {doctor_id} de nueva cita — ref #{ref}")
        if doctor_email:
            send_email(
                doctor_email,
                f"Nueva cita agendada — Ref. #{ref}",
                (
                    f"Tienes una nueva cita agendada.\n\n"
                    f"  • Número de referencia : #{ref}\n"
                    f"  • Tipo de atención     : {care_label}\n\n"
                    f"Revisa tu calendario en la plataforma para ver todos los detalles.\n\n"
                    f"— Equipo MedPlatform"
                ),
            )

    elif event_name == "appointment.cancelled":
        appointment_id = data.get("appointment_id", "N/A")
        patient_email = data.get("patient_email", "")
        ref = appointment_id[:8].upper() if appointment_id != "N/A" else "N/A"
        print(f"[US-026] ENVIAR EMAIL de cancelación — ref #{ref}")

        if patient_email:
            send_email(
                patient_email,
                f"Tu cita ha sido cancelada — Ref. #{ref}",
                (
                    f"Tu cita con referencia #{ref} ha sido cancelada.\n\n"
                    f"Si tienes dudas, contáctanos a través de la plataforma.\n\n"
                    f"— Equipo MedPlatform"
                ),
            )

    elif event_name == "user.registered":
        email = data.get("email", "")
        print(f"[US-BV] Email de bienvenida para {email}")
        if email:
            send_email(
                email,
                "Bienvenido a MedPlatform",
                (
                    f"¡Tu cuenta ha sido creada exitosamente!\n\n"
                    f"Ya puedes buscar médicos y agendar tus citas.\n\n"
                    f"— Equipo MedPlatform"
                ),
            )

    # Otros eventos (auth.login-*, doctor.*, schedule.*) se ignoran aquí


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.get_event_loop().run_in_executor(None, blocking_kafka_listener)
    yield


class HealthResponse(BaseModel):
    status: str


app = FastAPI(
    title="Notification Microservice",
    description=(
        "Servicio de notificaciones por email (SendGrid). Es **event-driven**: no expone endpoints de negocio, "
        "sino que consume el event bus Kafka y dispara emails en respuesta a los siguientes eventos:\n\n"
        "| Evento | Topic | Acción |\n"
        "|--------|-------|--------|\n"
        "| `appointment.created` | appointment-events | Email de confirmación al paciente y al médico |\n"
        "| `appointment.cancelled` | appointment-events | Email de cancelación al paciente |\n"
        "| `user.registered` | auth-events | Email de bienvenida al nuevo usuario |"
    ),
    version="1.0.0",
    root_path=os.getenv("ROOT_PATH", ""),
    lifespan=lifespan,
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Verificar estado del servicio",
    description="Devuelve `{status: ok}` si el servicio está activo. El consumer Kafka arranca en background al iniciar.",
)
def health_check():
    return {"status": "ok"}
