from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Optional

from ..domain.model.appointment import Appointment
from ..domain.model.time_block import TimeBlock


@dataclass(frozen=True)
class TimeBlockView:
    id: str
    doctor_id: str
    schedule_date: date
    start_time: time
    end_time: time
    status: str

    @staticmethod
    def of(tb: TimeBlock) -> "TimeBlockView":
        return TimeBlockView(
            id=tb.id,
            doctor_id=tb.doctor_id,
            schedule_date=tb.schedule_date,
            start_time=tb.time_range.start,
            end_time=tb.time_range.end,
            status=tb.status.value,
        )


@dataclass(frozen=True)
class AppointmentView:
    id: str
    patient_id: str
    doctor_id: str
    time_block_id: Optional[str]
    care_type: str
    notes: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    time_block: Optional[TimeBlockView] = None

    @staticmethod
    def of(appointment: Appointment, time_block: Optional[TimeBlock] = None) -> "AppointmentView":
        return AppointmentView(
            id=appointment.id,
            patient_id=appointment.patient_id,
            doctor_id=appointment.doctor_id,
            time_block_id=appointment.time_block_id,
            care_type=appointment.care_type.value,
            notes=appointment.notes.value,
            status=appointment.status.value,
            created_at=appointment.created_at,
            updated_at=appointment.updated_at,
            time_block=TimeBlockView.of(time_block) if time_block else None,
        )
