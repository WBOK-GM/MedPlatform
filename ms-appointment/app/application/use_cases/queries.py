from datetime import date
from typing import List, Optional

from ...domain.exceptions import AppointmentNotFound
from ...domain.model.value_objects import AppointmentId, DoctorId, PatientId
from ...domain.ports.unit_of_work import UnitOfWorkPort
from ..views import AppointmentView, TimeBlockView


class ListDoctorAvailabilityQuery:
    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    def execute(self, doctor_id: str, schedule_date: date) -> List[TimeBlockView]:
        with self._uow:
            blocks = self._uow.time_blocks.list_by_doctor_and_date(
                DoctorId(doctor_id), schedule_date, only_available=True
            )
            return [TimeBlockView.of(b) for b in blocks]


class ListDoctorSchedulesQuery:
    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    def execute(
        self,
        doctor_id: str,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[TimeBlockView]:
        with self._uow:
            blocks = self._uow.time_blocks.list_by_doctor(
                DoctorId(doctor_id), date_from=date_from, date_to=date_to
            )
            return [TimeBlockView.of(b) for b in blocks]


class GetAppointmentByIdQuery:
    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    def execute(self, appointment_id: str) -> AppointmentView:
        with self._uow:
            appointment = self._uow.appointments.get(AppointmentId(appointment_id))
            if appointment is None:
                raise AppointmentNotFound(appointment_id)
            time_block = None
            if appointment.time_block_id is not None:
                from ...domain.model.value_objects import TimeBlockId
                time_block = self._uow.time_blocks.get(TimeBlockId(appointment.time_block_id))
            return AppointmentView.of(appointment, time_block)


class ListDoctorAppointmentsQuery:
    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    def execute(self, doctor_id: str) -> List[AppointmentView]:
        with self._uow:
            appointments = self._uow.appointments.list_by_doctor(DoctorId(doctor_id))
            return [AppointmentView.of(a) for a in appointments]


class ListAppointmentsQuery:
    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    def execute(
        self,
        patient_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
    ) -> List[AppointmentView]:
        with self._uow:
            appointments = self._uow.appointments.list(
                patient_id=PatientId(patient_id) if patient_id else None,
                doctor_id=DoctorId(doctor_id) if doctor_id else None,
            )
            return [AppointmentView.of(a) for a in appointments]
