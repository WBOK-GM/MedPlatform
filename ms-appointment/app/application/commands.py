from dataclasses import dataclass
from datetime import date, time
from typing import Optional

from ..domain.model.value_objects import AppointmentStatus, CareType


@dataclass(frozen=True)
class CreateTimeBlockCommand:
    doctor_id: str
    schedule_date: date
    start_time: time
    end_time: time


@dataclass(frozen=True)
class CreateAppointmentCommand:
    patient_id: str
    doctor_id: str
    time_block_id: str
    care_type: CareType
    notes: Optional[str] = None
    patient_email: Optional[str] = None
    doctor_email: Optional[str] = None


@dataclass(frozen=True)
class CancelAppointmentCommand:
    appointment_id: str
    patient_email: Optional[str] = None
    doctor_email: Optional[str] = None


@dataclass(frozen=True)
class UpdateAppointmentStatusCommand:
    appointment_id: str
    new_status: AppointmentStatus


@dataclass(frozen=True)
class UpdateAppointmentNotesCommand:
    appointment_id: str
    notes: Optional[str]
