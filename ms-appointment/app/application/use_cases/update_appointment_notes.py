from ...domain.exceptions import AppointmentNotFound
from ...domain.model.value_objects import AppointmentId, Notes
from ...domain.ports.unit_of_work import UnitOfWorkPort
from ..commands import UpdateAppointmentNotesCommand
from ..views import AppointmentView


class UpdateAppointmentNotesUseCase:
    def __init__(self, uow: UnitOfWorkPort) -> None:
        self._uow = uow

    def execute(self, command: UpdateAppointmentNotesCommand) -> AppointmentView:
        with self._uow:
            appointment = self._uow.appointments.get(AppointmentId(command.appointment_id))
            if appointment is None:
                raise AppointmentNotFound(command.appointment_id)
            appointment.update_notes(Notes.of(command.notes))
            self._uow.appointments.save(appointment)
            self._uow.commit()
            return AppointmentView.of(appointment)
