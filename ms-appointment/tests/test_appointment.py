import pytest

from app.domain.events import (
    AppointmentCancelled,
    AppointmentCompleted,
    AppointmentConfirmed,
    AppointmentCreated,
)
from app.domain.exceptions import InvalidStatusTransition
from app.domain.model.appointment import Appointment
from app.domain.model.value_objects import (
    AppointmentStatus,
    CareType,
    DoctorId,
    Notes,
    PatientId,
    TimeBlockId,
)


def _new_appointment() -> Appointment:
    return Appointment.create(
        patient_id=PatientId("p-1"),
        doctor_id=DoctorId("d-1"),
        time_block_id=TimeBlockId("tb-1"),
        care_type=CareType.IN_PERSON,
        notes=Notes.of("first consultation"),
    )


class TestAppointment:
    def test_create_starts_confirmed_and_emits_event(self) -> None:
        appt = _new_appointment()
        assert appt.status == AppointmentStatus.CONFIRMED
        events = appt.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], AppointmentCreated)

    def test_cancel_changes_status_and_emits_event_and_unlinks_time_block(self) -> None:
        appt = _new_appointment()
        appt.pull_events()
        appt.cancel()
        assert appt.status == AppointmentStatus.CANCELLED
        assert appt.time_block_id is None
        events = appt.pull_events()
        assert any(isinstance(e, AppointmentCancelled) for e in events)

    def test_cancel_is_idempotent_when_already_cancelled(self) -> None:
        appt = _new_appointment()
        appt.cancel()
        appt.pull_events()
        appt.cancel()
        assert appt.pull_events() == []

    def test_cancel_rejected_when_already_completed(self) -> None:
        appt = _new_appointment()
        appt.complete()
        with pytest.raises(InvalidStatusTransition):
            appt.cancel()

    def test_confirm_emits_event_when_transitioning_from_pending(self) -> None:
        appt = _new_appointment()
        appt.change_status(AppointmentStatus.PENDING)
        appt.pull_events()
        appt.confirm()
        events = appt.pull_events()
        assert any(isinstance(e, AppointmentConfirmed) for e in events)

    def test_complete_rejected_when_cancelled(self) -> None:
        appt = _new_appointment()
        appt.cancel()
        with pytest.raises(InvalidStatusTransition):
            appt.complete()

    def test_complete_emits_event(self) -> None:
        appt = _new_appointment()
        appt.pull_events()
        appt.complete()
        events = appt.pull_events()
        assert any(isinstance(e, AppointmentCompleted) for e in events)

    def test_update_notes_replaces_value(self) -> None:
        appt = _new_appointment()
        appt.update_notes(Notes.of("updated"))
        assert appt.notes.value == "updated"
