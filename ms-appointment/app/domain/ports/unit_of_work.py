from abc import ABC, abstractmethod

from .repositories import AppointmentRepositoryPort, TimeBlockRepositoryPort


class UnitOfWorkPort(ABC):
    time_blocks: TimeBlockRepositoryPort
    appointments: AppointmentRepositoryPort

    @abstractmethod
    def __enter__(self) -> "UnitOfWorkPort": ...

    @abstractmethod
    def __exit__(self, exc_type, exc, tb) -> None: ...

    @abstractmethod
    def commit(self) -> None: ...

    @abstractmethod
    def rollback(self) -> None: ...
