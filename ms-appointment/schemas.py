from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime
from typing import Optional, List, Any
from models import TimeBlockStatus, AppointmentStatus, CareType

class TimeBlockBase(BaseModel):
    doctor_id: str
    schedule_date: date
    start_time: time
    end_time: time

class TimeBlockCreate(TimeBlockBase):
    pass

class TimeBlockResponse(TimeBlockBase):
    id: str
    status: TimeBlockStatus
    model_config = ConfigDict(from_attributes=True)

class TimeBlockSummary(BaseModel):
    id: str
    schedule_date: date
    start_time: time
    end_time: time
    model_config = ConfigDict(from_attributes=True)

class AppointmentBase(BaseModel):
    patient_id: str
    doctor_id: str
    time_block_id: str
    care_type: CareType
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_email: Optional[str] = None
    doctor_email: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: str
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
    time_block: Optional[TimeBlockResponse] = None
    model_config = ConfigDict(from_attributes=True)
