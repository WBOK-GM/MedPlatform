from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from ...domain.model.value_objects import AppointmentStatus, CareType, TimeBlockStatus


class TimeBlockBase(BaseModel):
    doctor_id: str = Field(..., description="UUID del médico dueño del bloque")
    schedule_date: date = Field(..., description="Fecha del bloque (YYYY-MM-DD)")
    start_time: time = Field(..., description="Hora de inicio del bloque (HH:MM)")
    end_time: time = Field(..., description="Hora de fin del bloque (HH:MM)")


class TimeBlockCreate(BaseModel):
    schedule_date: date = Field(..., description="Fecha del bloque (YYYY-MM-DD)")
    start_time: time = Field(..., description="Hora de inicio (HH:MM)")
    end_time: time = Field(..., description="Hora de fin (HH:MM)")


class TimeBlockResponse(TimeBlockBase):
    id: str = Field(..., description="UUID del bloque de tiempo")
    status: TimeBlockStatus = Field(..., description="Estado: AVAILABLE, OCCUPIED o CANCELLED")
    model_config = ConfigDict(from_attributes=True)


class AppointmentBase(BaseModel):
    patient_id: str = Field(..., description="UUID del paciente")
    doctor_id: str = Field(..., description="UUID del médico")
    time_block_id: Optional[str] = Field(None, description="UUID del bloque de tiempo reservado")
    care_type: CareType = Field(..., description="Modalidad de atención: IN_PERSON o VIRTUAL")
    notes: Optional[str] = Field(None, description="Notas o motivo de la consulta")


class AppointmentCreate(AppointmentBase):
    time_block_id: str = Field(..., description="UUID del bloque de tiempo a reservar")
    patient_email: Optional[str] = Field(None, description="Email del paciente para notificaciones")
    doctor_email: Optional[str] = Field(None, description="Email del médico para notificaciones")


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus = Field(..., description="Nuevo estado: PENDING, CONFIRMED, COMPLETED o CANCELLED")


class AppointmentNotesUpdate(BaseModel):
    notes: Optional[str] = Field(None, description="Nuevas notas o motivo de consulta")


class AppointmentResponse(AppointmentBase):
    id: str = Field(..., description="UUID de la cita")
    status: AppointmentStatus = Field(..., description="Estado actual de la cita")
    created_at: datetime = Field(..., description="Fecha y hora de creación (UTC)")
    updated_at: datetime = Field(..., description="Fecha y hora de última actualización (UTC)")
    time_block: Optional[TimeBlockResponse] = Field(None, description="Bloque de tiempo asociado")
    model_config = ConfigDict(from_attributes=True)
