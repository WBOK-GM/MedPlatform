from ...domain.exceptions import AppointmentNotFound
from ...domain.model.value_objects import AppointmentId, AppointmentStatus, TimeBlockId, TimeBlockStatus
from ...domain.ports.event_publisher import EventPublisherPort
from ...domain.ports.unit_of_work import UnitOfWorkPort
from ..commands import UpdateAppointmentStatusCommand
from ..views import AppointmentView


class UpdateAppointmentStatusUseCase:
    def __init__(self, uow: UnitOfWorkPort, publisher: EventPublisherPort) -> None:
        self._uow = uow
        self._publisher = publisher

    def execute(self, command: UpdateAppointmentStatusCommand) -> AppointmentView:
        with self._uow:
            appointment = self._uow.appointments.get(AppointmentId(command.appointment_id))
            if appointment is None:
                raise AppointmentNotFound(command.appointment_id)

            time_block_id = appointment.time_block_id
            appointment.change_status(command.new_status)
            self._uow.appointments.save(appointment)

            affected_block = None
            if time_block_id is not None:
                affected_block = self._uow.time_blocks.get(TimeBlockId(time_block_id))
                if affected_block is not None:
                    if command.new_status == AppointmentStatus.CANCELLED:
                        affected_block.release()
                        self._uow.time_blocks.save(affected_block)
                    elif command.new_status == AppointmentStatus.CONFIRMED \
                            and affected_block.status == TimeBlockStatus.AVAILABLE:
                        affected_block.reserve()
                        self._uow.time_blocks.save(affected_block)

            self._uow.commit()

            events = list(appointment.pull_events())
            if affected_block is not None:
                events.extend(affected_block.pull_events())
            self._publisher.publish_all(events)

            return AppointmentView.of(appointment)
