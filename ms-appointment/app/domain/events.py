from dataclasses import dataclass, field
from datetime import datetime, timezone


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@dataclass(frozen=True)
class DomainEvent:
    occurred_at: datetime = field(default_factory=_now_utc, kw_only=True)

    def event_name(self) -> str:  # pragma: no cover - overridden
        raise NotImplementedError


@dataclass(frozen=True)
class TimeBlockCreated(DomainEvent):
    time_block_id: str = ""
    doctor_id: str = ""

    def event_name(self) -> str:
        return "schedule.time-block-created"


@dataclass(frozen=True)
class TimeBlockOccupied(DomainEvent):
    time_block_id: str = ""

    def event_name(self) -> str:
        return "schedule.time-block-occupied"


@dataclass(frozen=True)
class TimeBlockReleased(DomainEvent):
    time_block_id: str = ""

    def event_name(self) -> str:
        return "schedule.time-block-released"


@dataclass(frozen=True)
class AppointmentCreated(DomainEvent):
    appointment_id: str = ""
    patient_id: str = ""
    doctor_id: str = ""
    care_type: str = ""

    def event_name(self) -> str:
        return "appointment.created"


@dataclass(frozen=True)
class AppointmentConfirmed(DomainEvent):
    appointment_id: str = ""

    def event_name(self) -> str:
        return "appointment.confirmed"


@dataclass(frozen=True)
class AppointmentCancelled(DomainEvent):
    appointment_id: str = ""

    def event_name(self) -> str:
        return "appointment.cancelled"


@dataclass(frozen=True)
class AppointmentCompleted(DomainEvent):
    appointment_id: str = ""

    def event_name(self) -> str:
        return "appointment.completed"
