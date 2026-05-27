from typing import List, Optional

from sqlalchemy.orm import Session

from ...domain.model.appointment import Appointment
from ...domain.model.value_objects import AppointmentId, DoctorId, PatientId
from ...domain.ports.repositories import AppointmentRepositoryPort
from .mappers import AppointmentMapper
from .orm_models import AppointmentORM


class SqlAlchemyAppointmentRepository(AppointmentRepositoryPort):
    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, appointment_id: AppointmentId) -> Optional[Appointment]:
        orm = self._session.query(AppointmentORM).filter(AppointmentORM.id == appointment_id).first()
        return AppointmentMapper.to_domain(orm) if orm else None

    def save(self, appointment: Appointment) -> Appointment:
        existing = self._session.query(AppointmentORM).filter(AppointmentORM.id == appointment.id).first()
        orm = AppointmentMapper.to_orm(appointment, existing)
        if existing is None:
            self._session.add(orm)
        self._session.flush()
        return AppointmentMapper.to_domain(orm)

    def list_by_doctor(self, doctor_id: DoctorId) -> List[Appointment]:
        results = self._session.query(AppointmentORM).filter(AppointmentORM.doctor_id == doctor_id).all()
        return [AppointmentMapper.to_domain(o) for o in results]

    def list(
        self,
        patient_id: Optional[PatientId] = None,
        doctor_id: Optional[DoctorId] = None,
    ) -> List[Appointment]:
        query = self._session.query(AppointmentORM)
        if patient_id:
            query = query.filter(AppointmentORM.patient_id == patient_id)
        if doctor_id:
            query = query.filter(AppointmentORM.doctor_id == doctor_id)
        return [AppointmentMapper.to_domain(o) for o in query.all()]
