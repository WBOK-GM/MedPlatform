import logging

from ...domain.exceptions import TimeBlockNotFound
from ...domain.model.appointment import Appointment
from ...domain.model.value_objects import (
    DoctorId,
    Notes,
    PatientId,
    TimeBlockId,
)
from ...domain.ports.event_publisher import EventPublisherPort
from ...domain.ports.unit_of_work import UnitOfWorkPort
from ..commands import CreateAppointmentCommand
from ..views import AppointmentView

log = logging.getLogger(__name__)


class CreateAppointmentUseCase:
    def __init__(self, uow: UnitOfWorkPort, publisher: EventPublisherPort) -> None:
        self._uow = uow
        self._publisher = publisher

    def execute(self, command: CreateAppointmentCommand) -> AppointmentView:
        with self._uow:
            time_block = self._uow.time_blocks.get(TimeBlockId(command.time_block_id))
            if time_block is None:
                raise TimeBlockNotFound(command.time_block_id)

            time_block.reserve()

            appointment = Appointment.create(
                patient_id=PatientId(command.patient_id),
                doctor_id=DoctorId(command.doctor_id),
                time_block_id=TimeBlockId(command.time_block_id),
                care_type=command.care_type,
                notes=Notes.of(command.notes),
            )

            self._uow.time_blocks.save(time_block)
            saved = self._uow.appointments.save(appointment)
            self._uow.commit()

            events = list(time_block.pull_events()) + list(appointment.pull_events())
            notification_payload = {
                "appointment_id": saved.id,
                "patient_id": saved.patient_id,
                "doctor_id": saved.doctor_id,
                "type": saved.care_type.value,
                "patient_email": command.patient_email or "",
                "doctor_email": command.doctor_email or "",
            }
            try:
                self._publisher.publish_all(events, notification_payload=notification_payload)
            except Exception:
                log.exception("Publisher failed after create commit — event lost, operation succeeded")

            return AppointmentView.of(saved, time_block)
