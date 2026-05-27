class DomainError(Exception):
    """Base domain exception."""


class TimeBlockNotFound(DomainError):
    def __init__(self, time_block_id: str) -> None:
        super().__init__(f"TimeBlock no encontrado: {time_block_id}")


class TimeBlockNotAvailable(DomainError):
    def __init__(self, time_block_id: str) -> None:
        super().__init__(f"TimeBlock no disponible: {time_block_id}")


class AppointmentNotFound(DomainError):
    def __init__(self, appointment_id: str) -> None:
        super().__init__(f"Appointment no encontrada: {appointment_id}")


class InvalidStatusTransition(DomainError):
    def __init__(self, current: str, requested: str) -> None:
        super().__init__(f"Transición inválida de {current} a {requested}")
