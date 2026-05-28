from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional

from ..events import (
    AppointmentCancelled,
    AppointmentCompleted,
    AppointmentConfirmed,
    AppointmentCreated,
    DomainEvent,
)
from ..exceptions import InvalidStatusTransition
from .value_objects import (
    AppointmentId,
    AppointmentStatus,
    CareType,
    DoctorId,
    Notes,
    PatientId,
    TimeBlockId,
    new_appointment_id,
)


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Appointment:
    id: AppointmentId
    patient_id: PatientId
    doctor_id: DoctorId
    time_block_id: Optional[TimeBlockId]
    care_type: CareType
    notes: Notes
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
    _events: List[DomainEvent] = field(default_factory=list, repr=False, compare=False)

    @classmethod
    def create(
        cls,
        patient_id: PatientId,
        doctor_id: DoctorId,
        time_block_id: TimeBlockId,
        care_type: CareType,
        notes: Optional[Notes] = None,
    ) -> "Appointment":
        now = _now_utc()
        appointment = cls(
            id=new_appointment_id(),
            patient_id=patient_id,
            doctor_id=doctor_id,
            time_block_id=time_block_id,
            care_type=care_type,
            notes=notes or Notes.empty(),
            status=AppointmentStatus.CONFIRMED,
            created_at=now,
            updated_at=now,
        )
        appointment._events.append(AppointmentCreated(
            appointment_id=appointment.id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            care_type=appointment.care_type.value,
        ))
        return appointment

    @classmethod
    def rehydrate(
        cls,
        id: AppointmentId,
        patient_id: PatientId,
        doctor_id: DoctorId,
        time_block_id: Optional[TimeBlockId],
        care_type: CareType,
        notes: Notes,
        status: AppointmentStatus,
        created_at: datetime,
        updated_at: datetime,
    ) -> "Appointment":
        return cls(
            id=id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            time_block_id=time_block_id,
            care_type=care_type,
            notes=notes,
            status=status,
            created_at=created_at,
            updated_at=updated_at,
        )

    def cancel(self) -> None:
        if self.status == AppointmentStatus.COMPLETED:
            raise InvalidStatusTransition(self.status.value, AppointmentStatus.CANCELLED.value)
        if self.status == AppointmentStatus.CANCELLED:
            return
        self.status = AppointmentStatus.CANCELLED
        self.time_block_id = None
        self.updated_at = _now_utc()
        self._events.append(AppointmentCancelled(appointment_id=self.id))

    def confirm(self) -> None:
        if self.status == AppointmentStatus.CANCELLED:
            raise InvalidStatusTransition(self.status.value, AppointmentStatus.CONFIRMED.value)
        if self.status == AppointmentStatus.CONFIRMED:
            return
        self.status = AppointmentStatus.CONFIRMED
        self.updated_at = _now_utc()
        self._events.append(AppointmentConfirmed(appointment_id=self.id))

    def complete(self) -> None:
        if self.status in (AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED):
            raise InvalidStatusTransition(self.status.value, AppointmentStatus.COMPLETED.value)
        self.status = AppointmentStatus.COMPLETED
        self.updated_at = _now_utc()
        self._events.append(AppointmentCompleted(appointment_id=self.id))

    def change_status(self, new_status: AppointmentStatus) -> None:
        if new_status == AppointmentStatus.CANCELLED:
            self.cancel()
        elif new_status == AppointmentStatus.CONFIRMED:
            self.confirm()
        elif new_status == AppointmentStatus.COMPLETED:
            self.complete()
        elif new_status == AppointmentStatus.PENDING:
            self.status = AppointmentStatus.PENDING
            self.updated_at = _now_utc()
        else:  # pragma: no cover - exhaustive
            raise InvalidStatusTransition(self.status.value, new_status.value)

    def update_notes(self, notes: Notes) -> None:
        self.notes = notes
        self.updated_at = _now_utc()

    def pull_events(self) -> List[DomainEvent]:
        events = list(self._events)
        self._events.clear()
        return events
