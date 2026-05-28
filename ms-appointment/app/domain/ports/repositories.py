from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional

from ..model.appointment import Appointment
from ..model.time_block import TimeBlock
from ..model.value_objects import (
    AppointmentId,
    DoctorId,
    PatientId,
    TimeBlockId,
)


class TimeBlockRepositoryPort(ABC):
    @abstractmethod
    def get(self, time_block_id: TimeBlockId) -> Optional[TimeBlock]: ...

    @abstractmethod
    def save(self, time_block: TimeBlock) -> TimeBlock: ...

    @abstractmethod
    def list_by_doctor_and_date(
        self, doctor_id: DoctorId, schedule_date: date, only_available: bool = False
    ) -> List[TimeBlock]: ...

    @abstractmethod
    def list_by_doctor(
        self,
        doctor_id: DoctorId,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[TimeBlock]: ...


class AppointmentRepositoryPort(ABC):
    @abstractmethod
    def get(self, appointment_id: AppointmentId) -> Optional[Appointment]: ...

    @abstractmethod
    def save(self, appointment: Appointment) -> Appointment: ...

    @abstractmethod
    def list_by_doctor(self, doctor_id: DoctorId) -> List[Appointment]: ...

    @abstractmethod
    def list(
        self,
        patient_id: Optional[PatientId] = None,
        doctor_id: Optional[DoctorId] = None,
    ) -> List[Appointment]: ...
