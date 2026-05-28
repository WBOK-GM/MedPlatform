from dataclasses import dataclass, field
from datetime import date
from typing import List

from ..events import (
    DomainEvent,
    TimeBlockCreated,
    TimeBlockOccupied,
    TimeBlockReleased,
)
from ..exceptions import TimeBlockNotAvailable
from .value_objects import (
    DoctorId,
    TimeBlockId,
    TimeBlockStatus,
    TimeRange,
    new_time_block_id,
)


@dataclass
class TimeBlock:
    id: TimeBlockId
    doctor_id: DoctorId
    schedule_date: date
    time_range: TimeRange
    status: TimeBlockStatus = TimeBlockStatus.AVAILABLE
    _events: List[DomainEvent] = field(default_factory=list, repr=False, compare=False)

    @classmethod
    def create(cls, doctor_id: DoctorId, schedule_date: date, time_range: TimeRange) -> "TimeBlock":
        tb = cls(
            id=new_time_block_id(),
            doctor_id=doctor_id,
            schedule_date=schedule_date,
            time_range=time_range,
            status=TimeBlockStatus.AVAILABLE,
        )
        tb._events.append(TimeBlockCreated(time_block_id=tb.id, doctor_id=tb.doctor_id))
        return tb

    @classmethod
    def rehydrate(
        cls,
        id: TimeBlockId,
        doctor_id: DoctorId,
        schedule_date: date,
        time_range: TimeRange,
        status: TimeBlockStatus,
    ) -> "TimeBlock":
        return cls(id=id, doctor_id=doctor_id, schedule_date=schedule_date,
                   time_range=time_range, status=status)

    def reserve(self) -> None:
        if self.status != TimeBlockStatus.AVAILABLE:
            raise TimeBlockNotAvailable(self.id)
        self.status = TimeBlockStatus.OCCUPIED
        self._events.append(TimeBlockOccupied(time_block_id=self.id))

    def release(self) -> None:
        if self.status == TimeBlockStatus.AVAILABLE:
            return
        self.status = TimeBlockStatus.AVAILABLE
        self._events.append(TimeBlockReleased(time_block_id=self.id))

    def pull_events(self) -> List[DomainEvent]:
        events = list(self._events)
        self._events.clear()
        return events
