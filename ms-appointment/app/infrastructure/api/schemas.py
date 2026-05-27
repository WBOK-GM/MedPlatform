from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict

from ...domain.model.value_objects import AppointmentStatus, CareType, TimeBlockStatus


class TimeBlockBase(BaseModel):
    doctor_id: str
    schedule_date: date
    start_time: time
    end_time: time


class TimeBlockCreate(BaseModel):
    schedule_date: date
    start_time: time
    end_time: time


class TimeBlockResponse(TimeBlockBase):
    id: str
    status: TimeBlockStatus
    model_config = ConfigDict(from_attributes=True)


class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: str
    time_block_id: Optional[str] = None
    care_type: CareType
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    time_block_id: str
    patient_email: Optional[str] = None
    doctor_email: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentNotesUpdate(BaseModel):
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: str
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
    time_block: Optional[TimeBlockResponse] = None
    model_config = ConfigDict(from_attributes=True)
