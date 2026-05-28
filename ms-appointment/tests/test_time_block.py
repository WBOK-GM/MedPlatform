from datetime import date, time

import pytest

from app.domain.events import TimeBlockCreated, TimeBlockOccupied, TimeBlockReleased
from app.domain.exceptions import TimeBlockNotAvailable
from app.domain.model.time_block import TimeBlock
from app.domain.model.value_objects import DoctorId, TimeBlockStatus, TimeRange


def _new_block() -> TimeBlock:
    return TimeBlock.create(
        doctor_id=DoctorId("d-1"),
        schedule_date=date(2026, 6, 1),
        time_range=TimeRange(time(9, 0), time(10, 0)),
    )


class TestTimeBlock:
    def test_create_starts_available_and_emits_event(self) -> None:
        tb = _new_block()
        assert tb.status == TimeBlockStatus.AVAILABLE
        events = tb.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], TimeBlockCreated)

    def test_reserve_moves_to_occupied_and_emits_event(self) -> None:
        tb = _new_block()
        tb.pull_events()
        tb.reserve()
        assert tb.status == TimeBlockStatus.OCCUPIED
        events = tb.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], TimeBlockOccupied)

    def test_reserve_raises_when_not_available(self) -> None:
        tb = _new_block()
        tb.reserve()
        with pytest.raises(TimeBlockNotAvailable):
            tb.reserve()

    def test_release_moves_back_to_available_and_emits_event(self) -> None:
        tb = _new_block()
        tb.reserve()
        tb.pull_events()
        tb.release()
        assert tb.status == TimeBlockStatus.AVAILABLE
        events = tb.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], TimeBlockReleased)

    def test_release_is_idempotent_when_already_available(self) -> None:
        tb = _new_block()
        tb.pull_events()
        tb.release()
        assert tb.pull_events() == []
