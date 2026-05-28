from typing import Optional

from sqlalchemy.orm import Session, sessionmaker

from ...domain.ports.unit_of_work import UnitOfWorkPort
from .appointment_repository import SqlAlchemyAppointmentRepository
from .time_block_repository import SqlAlchemyTimeBlockRepository


class SqlAlchemyUnitOfWork(UnitOfWorkPort):
    def __init__(self, session_factory: sessionmaker) -> None:
        self._session_factory = session_factory
        self._session: Optional[Session] = None

    def __enter__(self) -> "SqlAlchemyUnitOfWork":
        self._session = self._session_factory()
        self.time_blocks = SqlAlchemyTimeBlockRepository(self._session)
        self.appointments = SqlAlchemyAppointmentRepository(self._session)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if exc_type is not None:
            self.rollback()
        if self._session is not None:
            self._session.close()
            self._session = None

    def commit(self) -> None:
        assert self._session is not None
        self._session.commit()

    def rollback(self) -> None:
        if self._session is not None:
            self._session.rollback()
