from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from ...domain.model.time_block import TimeBlock
from ...domain.model.value_objects import DoctorId, TimeBlockId, TimeBlockStatus
from ...domain.ports.repositories import TimeBlockRepositoryPort
from .mappers import TimeBlockMapper
from .orm_models import TimeBlockORM


class SqlAlchemyTimeBlockRepository(TimeBlockRepositoryPort):
    def __init__(self, session: Session) -> None:
        self._session = session

    def get(self, time_block_id: TimeBlockId) -> Optional[TimeBlock]:
        orm = self._session.query(TimeBlockORM).filter(TimeBlockORM.id == time_block_id).first()
        return TimeBlockMapper.to_domain(orm) if orm else None

    def save(self, time_block: TimeBlock) -> TimeBlock:
        existing = self._session.query(TimeBlockORM).filter(TimeBlockORM.id == time_block.id).first()
        orm = TimeBlockMapper.to_orm(time_block, existing)
        if existing is None:
            self._session.add(orm)
        self._session.flush()
        return TimeBlockMapper.to_domain(orm)

    def list_by_doctor_and_date(
        self, doctor_id: DoctorId, schedule_date: date, only_available: bool = False
    ) -> List[TimeBlock]:
        query = self._session.query(TimeBlockORM).filter(
            TimeBlockORM.doctor_id == doctor_id,
            TimeBlockORM.schedule_date == schedule_date,
        )
        if only_available:
            query = query.filter(TimeBlockORM.status == TimeBlockStatus.AVAILABLE)
        return [TimeBlockMapper.to_domain(o) for o in query.all()]

    def list_by_doctor(
        self,
        doctor_id: DoctorId,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> List[TimeBlock]:
        query = self._session.query(TimeBlockORM).filter(TimeBlockORM.doctor_id == doctor_id)
        if date_from:
            query = query.filter(TimeBlockORM.schedule_date >= date_from)
        if date_to:
            query = query.filter(TimeBlockORM.schedule_date <= date_to)
        query = query.order_by(TimeBlockORM.schedule_date, TimeBlockORM.start_time)
        return [TimeBlockMapper.to_domain(o) for o in query.all()]
