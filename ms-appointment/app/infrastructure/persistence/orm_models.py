import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, String, Time
from sqlalchemy.orm import relationship

from ...domain.model.value_objects import (
    AppointmentStatus,
    CareType,
    TimeBlockStatus,
)
from .database import Base


class TimeBlockORM(Base):
    __tablename__ = "time_blocks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, index=True, nullable=False)
    schedule_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(Enum(TimeBlockStatus), default=TimeBlockStatus.AVAILABLE)

    appointment = relationship("AppointmentORM", back_populates="time_block", uselist=False)


class AppointmentORM(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, index=True, nullable=False)
    doctor_id = Column(String, index=True, nullable=False)
    time_block_id = Column(String, ForeignKey("time_blocks.id"), unique=True)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.CONFIRMED)
    care_type = Column(Enum(CareType), nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    time_block = relationship("TimeBlockORM", back_populates="appointment")
