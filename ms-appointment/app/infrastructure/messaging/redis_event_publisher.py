import json
import logging
from typing import Any, Dict, Iterable, Optional

import redis

from ...domain.events import (
    AppointmentCancelled,
    AppointmentCreated,
    DomainEvent,
)
from ...domain.ports.event_publisher import EventPublisherPort

log = logging.getLogger("DomainEvents")


class RedisEventPublisher(EventPublisherPort):
    """Publishes domain events. Preserves the legacy contract with ms-notification:
    - 'appointment:created' channel receives the full payload (with emails)
    - 'appointment:cancelled' channel receives { appointment_id }
    Other domain events are only logged for observability.
    """

    def __init__(self, redis_client: "redis.Redis") -> None:
        self._redis = redis_client

    def publish_all(
        self,
        events: Iterable[DomainEvent],
        notification_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        for event in events:
            log.info("%s @ %s :: %s", event.event_name(), event.occurred_at.isoformat(), event)
            if isinstance(event, AppointmentCreated):
                payload = notification_payload or {
                    "appointment_id": event.appointment_id,
                    "patient_id": event.patient_id,
                    "doctor_id": event.doctor_id,
                    "type": event.care_type,
                }
                self._redis.publish("appointment:created", json.dumps(payload))
            elif isinstance(event, AppointmentCancelled):
                self._redis.publish(
                    "appointment:cancelled",
                    json.dumps({"appointment_id": event.appointment_id}),
                )
