from ...domain.model.time_block import TimeBlock
from ...domain.model.value_objects import DoctorId, TimeRange
from ...domain.ports.event_publisher import EventPublisherPort
from ...domain.ports.unit_of_work import UnitOfWorkPort
from ..commands import CreateTimeBlockCommand
from ..views import TimeBlockView


class CreateTimeBlockUseCase:
    def __init__(self, uow: UnitOfWorkPort, publisher: EventPublisherPort) -> None:
        self._uow = uow
        self._publisher = publisher

    def execute(self, command: CreateTimeBlockCommand) -> TimeBlockView:
        time_block = TimeBlock.create(
            doctor_id=DoctorId(command.doctor_id),
            schedule_date=command.schedule_date,
            time_range=TimeRange(start=command.start_time, end=command.end_time),
        )
        with self._uow:
            saved = self._uow.time_blocks.save(time_block)
            self._uow.commit()
        self._publisher.publish_all(time_block.pull_events())
        return TimeBlockView.of(saved)
