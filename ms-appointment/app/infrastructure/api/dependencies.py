from functools import lru_cache

import redis
from sqlalchemy.orm import sessionmaker

from ...application.use_cases.cancel_appointment import CancelAppointmentUseCase
from ...application.use_cases.create_appointment import CreateAppointmentUseCase
from ...application.use_cases.create_time_block import CreateTimeBlockUseCase
from ...application.use_cases.queries import (
    GetAppointmentByIdQuery,
    ListAppointmentsQuery,
    ListDoctorAppointmentsQuery,
    ListDoctorAvailabilityQuery,
    ListDoctorSchedulesQuery,
)
from ...application.use_cases.update_appointment_notes import UpdateAppointmentNotesUseCase
from ...application.use_cases.update_appointment_status import UpdateAppointmentStatusUseCase
from ..messaging.redis_event_publisher import RedisEventPublisher
from ..persistence.database import SessionLocal
from ..persistence.sqlalchemy_uow import SqlAlchemyUnitOfWork
from ...config import settings


@lru_cache(maxsize=1)
def get_redis_client() -> "redis.Redis":
    return redis.from_url(settings.redis_url, decode_responses=True)


def get_session_factory() -> sessionmaker:
    return SessionLocal


def get_event_publisher() -> RedisEventPublisher:
    return RedisEventPublisher(get_redis_client())


def get_uow() -> SqlAlchemyUnitOfWork:
    return SqlAlchemyUnitOfWork(get_session_factory())


def get_create_appointment_use_case() -> CreateAppointmentUseCase:
    return CreateAppointmentUseCase(get_uow(), get_event_publisher())


def get_create_time_block_use_case() -> CreateTimeBlockUseCase:
    return CreateTimeBlockUseCase(get_uow(), get_event_publisher())


def get_cancel_appointment_use_case() -> CancelAppointmentUseCase:
    return CancelAppointmentUseCase(get_uow(), get_event_publisher())


def get_update_status_use_case() -> UpdateAppointmentStatusUseCase:
    return UpdateAppointmentStatusUseCase(get_uow(), get_event_publisher())


def get_update_notes_use_case() -> UpdateAppointmentNotesUseCase:
    return UpdateAppointmentNotesUseCase(get_uow())


def get_list_availability_query() -> ListDoctorAvailabilityQuery:
    return ListDoctorAvailabilityQuery(get_uow())


def get_list_schedules_query() -> ListDoctorSchedulesQuery:
    return ListDoctorSchedulesQuery(get_uow())


def get_appointment_by_id_query() -> GetAppointmentByIdQuery:
    return GetAppointmentByIdQuery(get_uow())


def get_list_doctor_appointments_query() -> ListDoctorAppointmentsQuery:
    return ListDoctorAppointmentsQuery(get_uow())


def get_list_appointments_query() -> ListAppointmentsQuery:
    return ListAppointmentsQuery(get_uow())
