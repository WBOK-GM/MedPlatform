from datetime import date, time
from typing import Any, Dict, Iterable, List, Optional

import pytest

from app.application.commands import CreateAppointmentCommand
from app.application.use_cases.create_appointment import CreateAppointmentUseCase
from app.domain.events import DomainEvent
from app.domain.exceptions import TimeBlockNotAvailable, TimeBlockNotFound
from app.domain.model.appointment import Appointment
from app.domain.model.time_block import TimeBlock
from app.domain.model.value_objects import (
    AppointmentId,
    CareType,
    DoctorId,
    PatientId,
    TimeBlockId,
    TimeBlockStatus,
    TimeRange,
)
from app.domain.ports.event_publisher import EventPublisherPort
from app.domain.ports.repositories import (
    AppointmentRepositoryPort,
    TimeBlockRepositoryPort,
)
from app.domain.ports.unit_of_work import UnitOfWorkPort


class InMemoryTimeBlockRepo(TimeBlockRepositoryPort):
    def __init__(self) -> None:
        self.store: Dict[str, TimeBlock] = {}

    def get(self, tb_id):
        return self.store.get(tb_id)

    def save(self, tb):
        self.store[tb.id] = tb
        return tb

    def list_by_doctor_and_date(self, doctor_id, schedule_date, only_available=False):
        return []

    def list_by_doctor(self, doctor_id, date_from=None, date_to=None):
        return []


class InMemoryAppointmentRepo(AppointmentRepositoryPort):
    def __init__(self) -> None:
        self.store: Dict[str, Appointment] = {}

    def get(self, appointment_id):
        return self.store.get(appointment_id)

    def save(self, appointment):
        self.store[appointment.id] = appointment
        return appointment

    def list_by_doctor(self, doctor_id):
        return [a for a in self.store.values() if a.doctor_id == doctor_id]

    def list(self, patient_id=None, doctor_id=None):
        result = list(self.store.values())
        if patient_id:
            result = [a for a in result if a.patient_id == patient_id]
        if doctor_id:
            result = [a for a in result if a.doctor_id == doctor_id]
        return result


class FakeUoW(UnitOfWorkPort):
    def __init__(self) -> None:
        self.time_blocks = InMemoryTimeBlockRepo()
        self.appointments = InMemoryAppointmentRepo()
        self.committed = False

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return None

    def commit(self):
        self.committed = True

    def rollback(self):
        self.committed = False


class CollectingPublisher(EventPublisherPort):
    def __init__(self) -> None:
        self.events: List[DomainEvent] = []
        self.payload: Optional[Dict[str, Any]] = None

    def publish_all(self, events: Iterable[DomainEvent], notification_payload=None):
        self.events.extend(list(events))
        self.payload = notification_payload


def _seed_block(uow: FakeUoW, status: TimeBlockStatus = TimeBlockStatus.AVAILABLE) -> TimeBlock:
    block = TimeBlock.create(
        doctor_id=DoctorId("d-1"),
        schedule_date=date(2026, 6, 1),
        time_range=TimeRange(time(9, 0), time(10, 0)),
    )
    block.pull_events()
    if status == TimeBlockStatus.OCCUPIED:
        block.reserve()
        block.pull_events()
    uow.time_blocks.save(block)
    return block


class TestCreateAppointmentUseCase:
    def test_happy_path_reserves_block_creates_appointment_and_publishes_event(self) -> None:
        uow = FakeUoW()
        publisher = CollectingPublisher()
        block = _seed_block(uow)

        use_case = CreateAppointmentUseCase(uow, publisher)
        view = use_case.execute(CreateAppointmentCommand(
            patient_id="p-1",
            doctor_id="d-1",
            time_block_id=block.id,
            care_type=CareType.IN_PERSON,
            notes="first consult",
            patient_email="p@example.com",
            doctor_email="d@example.com",
        ))

        assert view.status == "CONFIRMED"
        assert uow.committed is True
        assert uow.time_blocks.store[block.id].status == TimeBlockStatus.OCCUPIED
        assert any(e.event_name() == "appointment.created" for e in publisher.events)
        assert publisher.payload is not None
        assert publisher.payload["patient_email"] == "p@example.com"

    def test_raises_when_time_block_missing(self) -> None:
        uow = FakeUoW()
        publisher = CollectingPublisher()
        use_case = CreateAppointmentUseCase(uow, publisher)
        with pytest.raises(TimeBlockNotFound):
            use_case.execute(CreateAppointmentCommand(
                patient_id="p-1", doctor_id="d-1", time_block_id="missing",
                care_type=CareType.IN_PERSON,
            ))

    def test_raises_when_time_block_not_available(self) -> None:
        uow = FakeUoW()
        publisher = CollectingPublisher()
        block = _seed_block(uow, status=TimeBlockStatus.OCCUPIED)
        use_case = CreateAppointmentUseCase(uow, publisher)
        with pytest.raises(TimeBlockNotAvailable):
            use_case.execute(CreateAppointmentCommand(
                patient_id="p-1", doctor_id="d-1", time_block_id=block.id,
                care_type=CareType.IN_PERSON,
            ))
        # publisher should not have received appointment.created
        assert all(e.event_name() != "appointment.created" for e in publisher.events)
