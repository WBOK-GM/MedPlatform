from datetime import datetime
from typing import Optional

from ...domain.model.appointment import Appointment
from ...domain.model.time_block import TimeBlock
from ...domain.model.value_objects import (
    AppointmentId,
    AppointmentStatus,
    CareType,
    DoctorId,
    Notes,
    PatientId,
    TimeBlockId,
    TimeBlockStatus,
    TimeRange,
)
from .orm_models import AppointmentORM, TimeBlockORM


class TimeBlockMapper:
    @staticmethod
    def to_domain(orm: TimeBlockORM) -> TimeBlock:
        return TimeBlock.rehydrate(
            id=TimeBlockId(orm.id),
            doctor_id=DoctorId(orm.doctor_id),
            schedule_date=orm.schedule_date,
            time_range=TimeRange(start=orm.start_time, end=orm.end_time),
            status=TimeBlockStatus(orm.status if isinstance(orm.status, str) else orm.status.value),
        )

    @staticmethod
    def to_orm(tb: TimeBlock, existing: Optional[TimeBlockORM] = None) -> TimeBlockORM:
        orm = existing or TimeBlockORM()
        orm.id = tb.id
        orm.doctor_id = tb.doctor_id
        orm.schedule_date = tb.schedule_date
        orm.start_time = tb.time_range.start
        orm.end_time = tb.time_range.end
        orm.status = tb.status
        return orm


class AppointmentMapper:
    @staticmethod
    def to_domain(orm: AppointmentORM) -> Appointment:
        return Appointment.rehydrate(
            id=AppointmentId(orm.id),
            patient_id=PatientId(orm.patient_id),
            doctor_id=DoctorId(orm.doctor_id),
            time_block_id=TimeBlockId(orm.time_block_id) if orm.time_block_id else None,
            care_type=CareType(orm.care_type if isinstance(orm.care_type, str) else orm.care_type.value),
            notes=Notes.of(orm.notes),
            status=AppointmentStatus(orm.status if isinstance(orm.status, str) else orm.status.value),
            created_at=orm.created_at or datetime.utcnow(),
            updated_at=orm.updated_at or datetime.utcnow(),
        )

    @staticmethod
    def to_orm(appointment: Appointment, existing: Optional[AppointmentORM] = None) -> AppointmentORM:
        orm = existing or AppointmentORM()
        orm.id = appointment.id
        orm.patient_id = appointment.patient_id
        orm.doctor_id = appointment.doctor_id
        orm.time_block_id = appointment.time_block_id
        orm.status = appointment.status
        orm.care_type = appointment.care_type
        orm.notes = appointment.notes.value
        if orm.created_at is None:
            orm.created_at = appointment.created_at
        orm.updated_at = appointment.updated_at
        return orm
