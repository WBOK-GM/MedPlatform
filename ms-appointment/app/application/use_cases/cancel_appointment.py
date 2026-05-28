from ...domain.exceptions import AppointmentNotFound
from ...domain.model.value_objects import AppointmentId, TimeBlockId
from ...domain.ports.event_publisher import EventPublisherPort
from ...domain.ports.unit_of_work import UnitOfWorkPort
from ..commands import CancelAppointmentCommand
from ..views import AppointmentView


class CancelAppointmentUseCase:
    def __init__(self, uow: UnitOfWorkPort, publisher: EventPublisherPort) -> None:
        self._uow = uow
        self._publisher = publisher

    def execute(self, command: CancelAppointmentCommand) -> AppointmentView:
        with self._uow:
            appointment = self._uow.appointments.get(AppointmentId(command.appointment_id))
            if appointment is None:
                raise AppointmentNotFound(command.appointment_id)

            previous_time_block_id = appointment.time_block_id
            appointment.cancel()
            self._uow.appointments.save(appointment)

            released_block = None
            if previous_time_block_id is not None:
                released_block = self._uow.time_blocks.get(TimeBlockId(previous_time_block_id))
                if released_block is not None:
                    released_block.release()
                    self._uow.time_blocks.save(released_block)

            self._uow.commit()

            events = list(appointment.pull_events())
            if released_block is not None:
                events.extend(released_block.pull_events())
            self._publisher.publish_all(events)

            return AppointmentView.of(appointment)
