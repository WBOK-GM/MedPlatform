from dataclasses import dataclass
from datetime import date, time
from enum import Enum
from typing import NewType
from uuid import uuid4

AppointmentId = NewType("AppointmentId", str)
TimeBlockId = NewType("TimeBlockId", str)
DoctorId = NewType("DoctorId", str)
PatientId = NewType("PatientId", str)


def new_appointment_id() -> AppointmentId:
    return AppointmentId(str(uuid4()))


def new_time_block_id() -> TimeBlockId:
    return TimeBlockId(str(uuid4()))


class AppointmentStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TimeBlockStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    CANCELLED = "CANCELLED"


class CareType(str, Enum):
    IN_PERSON = "IN_PERSON"
    VIRTUAL = "VIRTUAL"


@dataclass(frozen=True)
class TimeRange:
    start: time
    end: time

    def __post_init__(self) -> None:
        if self.start >= self.end:
            raise ValueError(f"TimeRange invalid: start {self.start} must be before end {self.end}")

    def overlaps(self, other: "TimeRange") -> bool:
        return self.start < other.end and other.start < self.end


@dataclass(frozen=True)
class ScheduleDate:
    value: date

    @staticmethod
    def of(d: date) -> "ScheduleDate":
        return ScheduleDate(d)


@dataclass(frozen=True)
class Notes:
    value: str | None

    @staticmethod
    def empty() -> "Notes":
        return Notes(None)

    @staticmethod
    def of(v: str | None) -> "Notes":
        if v is None:
            return Notes(None)
        v = v.strip()
        if not v:
            return Notes(None)
        return Notes(v)
