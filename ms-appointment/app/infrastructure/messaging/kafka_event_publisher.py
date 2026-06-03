import json
import logging
from typing import Any, Dict, Iterable, Optional

from kafka import KafkaProducer

from ...domain.events import (
    AppointmentCancelled,
    AppointmentCreated,
    DomainEvent,
)
from ...domain.ports.event_publisher import EventPublisherPort

log = logging.getLogger("DomainEvents")

TOPIC = "appointment-events"


class KafkaEventPublisher(EventPublisherPort):
    """Publica domain events a Kafka. Preserva el contrato de notification_payload:
    - appointment.created envía el payload completo (con patient_email/doctor_email)
    - appointment.cancelled mezcla notification_payload si se pasa
    Otros domain events se loguean y se publican con sus campos propios.
    """

    def __init__(self, producer: "KafkaProducer") -> None:
        self._producer = producer

    def publish_all(
        self,
        events: Iterable[DomainEvent],
        notification_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        for event in events:
            log.info(
                "%s @ %s :: %s",
                event.event_name(),
                event.occurred_at.isoformat(),
                event,
            )

            aggregate_id = (
                getattr(event, "appointment_id", None)
                or getattr(event, "time_block_id", None)
                or "unknown"
            )

            if isinstance(event, AppointmentCreated):
                data = notification_payload or {
                    "appointment_id": event.appointment_id,
                    "patient_id": event.patient_id,
                    "doctor_id": event.doctor_id,
                    "type": event.care_type,
                }
            elif isinstance(event, AppointmentCancelled):
                data = {"appointment_id": event.appointment_id}
                if notification_payload:
                    data.update(notification_payload)
            else:
                data = {
                    k: v
                    for k, v in event.__dict__.items()
                    if not k.startswith("_")
                }

            envelope = {
                "eventName": event.event_name(),
                "occurredAt": event.occurred_at.isoformat(),
                "aggregateId": aggregate_id,
                "version": 1,
                "data": data,
            }
            log.info(
                "%s -> %s key=%s",
                event.event_name(),
                TOPIC,
                aggregate_id,
            )
            self._producer.send(
                TOPIC,
                key=aggregate_id.encode("utf-8"),
                value=json.dumps(envelope).encode("utf-8"),
            )

        # flush síncrono: garantiza entrega antes de salir del UoW
        self._producer.flush()
