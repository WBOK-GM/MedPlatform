from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends

from ...application.commands import CreateTimeBlockCommand
from ...application.use_cases.create_time_block import CreateTimeBlockUseCase
from ...application.use_cases.queries import (
    ListDoctorAvailabilityQuery,
    ListDoctorSchedulesQuery,
)
from .dependencies import (
    get_create_time_block_use_case,
    get_list_availability_query,
    get_list_schedules_query,
)
from .schemas import TimeBlockCreate, TimeBlockResponse

router = APIRouter(tags=["Schedules"])


@router.post(
    "/doctors/{doctor_id}/schedules",
    response_model=TimeBlockResponse,
    status_code=201,
    summary="Crear bloque de disponibilidad",
    description="Agrega un nuevo bloque de tiempo al horario del médico. El bloque queda en estado AVAILABLE hasta que un paciente lo reserve.",
)
def create_time_block(
    doctor_id: str,
    payload: TimeBlockCreate,
    use_case: CreateTimeBlockUseCase = Depends(get_create_time_block_use_case),
):
    view = use_case.execute(
        CreateTimeBlockCommand(
            doctor_id=doctor_id,
            schedule_date=payload.schedule_date,
            start_time=payload.start_time,
            end_time=payload.end_time,
        )
    )
    return _serialize_time_block(view)


@router.get(
    "/doctors/{doctor_id}/availability",
    response_model=List[TimeBlockResponse],
    summary="Consultar disponibilidad de un médico por fecha",
    description="Devuelve los bloques de tiempo en estado AVAILABLE del médico para la fecha indicada.",
)
def get_availability(
    doctor_id: str,
    schedule_date: date,
    query: ListDoctorAvailabilityQuery = Depends(get_list_availability_query),
):
    return [_serialize_time_block(v) for v in query.execute(doctor_id, schedule_date)]


@router.get(
    "/doctors/{doctor_id}/schedules",
    response_model=List[TimeBlockResponse],
    summary="Listar todos los bloques del médico",
    description="Devuelve todos los bloques de tiempo del médico, opcionalmente filtrados por rango de fechas (`date_from` / `date_to`).",
)
def get_doctor_schedules(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    query: ListDoctorSchedulesQuery = Depends(get_list_schedules_query),
):
    return [_serialize_time_block(v) for v in query.execute(doctor_id, date_from, date_to)]


def _serialize_time_block(view) -> dict:
    return {
        "id": view.id,
        "doctor_id": view.doctor_id,
        "schedule_date": view.schedule_date,
        "start_time": view.start_time,
        "end_time": view.end_time,
        "status": view.status,
    }
