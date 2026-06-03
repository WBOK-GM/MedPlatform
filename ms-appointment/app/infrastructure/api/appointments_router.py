from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from ...application.commands import (
    CancelAppointmentCommand,
    CreateAppointmentCommand,
    UpdateAppointmentNotesCommand,
    UpdateAppointmentStatusCommand,
)
from ...application.use_cases.cancel_appointment import CancelAppointmentUseCase
from ...application.use_cases.create_appointment import CreateAppointmentUseCase
from ...application.use_cases.queries import (
    GetAppointmentByIdQuery,
    ListAppointmentsQuery,
    ListDoctorAppointmentsQuery,
)
from ...application.use_cases.update_appointment_notes import UpdateAppointmentNotesUseCase
from ...application.use_cases.update_appointment_status import UpdateAppointmentStatusUseCase
from ...domain.exceptions import (
    AppointmentNotFound,
    InvalidStatusTransition,
    TimeBlockNotAvailable,
    TimeBlockNotFound,
)
from .dependencies import (
    get_appointment_by_id_query,
    get_cancel_appointment_use_case,
    get_create_appointment_use_case,
    get_list_appointments_query,
    get_list_doctor_appointments_query,
    get_update_notes_use_case,
    get_update_status_use_case,
)
from .schemas import (
    AppointmentCreate,
    AppointmentNotesUpdate,
    AppointmentResponse,
    AppointmentStatusUpdate,
)

router = APIRouter(tags=["Appointments"])


def _serialize_appointment(view) -> dict:
    return {
        "id": view.id,
        "patient_id": view.patient_id,
        "doctor_id": view.doctor_id,
        "time_block_id": view.time_block_id,
        "care_type": view.care_type,
        "notes": view.notes,
        "status": view.status,
        "created_at": view.created_at,
        "updated_at": view.updated_at,
        "time_block": (
            {
                "id": view.time_block.id,
                "doctor_id": view.time_block.doctor_id,
                "schedule_date": view.time_block.schedule_date,
                "start_time": view.time_block.start_time,
                "end_time": view.time_block.end_time,
                "status": view.time_block.status,
            }
            if view.time_block else None
        ),
    }


@router.post("/appointments", response_model=AppointmentResponse)
def create_appointment(
    payload: AppointmentCreate,
    use_case: CreateAppointmentUseCase = Depends(get_create_appointment_use_case),
):
    try:
        view = use_case.execute(
            CreateAppointmentCommand(
                patient_id=payload.patient_id,
                doctor_id=payload.doctor_id,
                time_block_id=payload.time_block_id,
                care_type=payload.care_type,
                notes=payload.notes,
                patient_email=payload.patient_email,
                doctor_email=payload.doctor_email,
            )
        )
        return _serialize_appointment(view)
    except TimeBlockNotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except TimeBlockNotAvailable as e:
        raise HTTPException(status_code=400, detail="TimeBlock is not available") from e


@router.put("/appointments/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: str,
    patient_email: Optional[str] = None,
    doctor_email: Optional[str] = None,
    use_case: CancelAppointmentUseCase = Depends(get_cancel_appointment_use_case),
):
    try:
        view = use_case.execute(
            CancelAppointmentCommand(
                appointment_id=appointment_id,
                patient_email=patient_email,
                doctor_email=doctor_email,
            )
        )
        return _serialize_appointment(view)
    except AppointmentNotFound as e:
        raise HTTPException(status_code=404, detail="Appointment not found") from e
    except InvalidStatusTransition as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.patch("/appointments/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: str,
    status_update: AppointmentStatusUpdate,
    use_case: UpdateAppointmentStatusUseCase = Depends(get_update_status_use_case),
):
    try:
        view = use_case.execute(UpdateAppointmentStatusCommand(
            appointment_id=appointment_id, new_status=status_update.status))
        return _serialize_appointment(view)
    except AppointmentNotFound as e:
        raise HTTPException(status_code=404, detail="Appointment not found") from e
    except InvalidStatusTransition as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.patch("/appointments/{appointment_id}/notes", response_model=AppointmentResponse)
def update_appointment_notes(
    appointment_id: str,
    notes_update: AppointmentNotesUpdate,
    use_case: UpdateAppointmentNotesUseCase = Depends(get_update_notes_use_case),
):
    try:
        view = use_case.execute(UpdateAppointmentNotesCommand(
            appointment_id=appointment_id, notes=notes_update.notes))
        return _serialize_appointment(view)
    except AppointmentNotFound as e:
        raise HTTPException(status_code=404, detail="Appointment not found") from e


@router.get("/doctors/{doctor_id}/appointments", response_model=List[AppointmentResponse])
def get_doctor_appointments(
    doctor_id: str,
    query: ListDoctorAppointmentsQuery = Depends(get_list_doctor_appointments_query),
):
    return [_serialize_appointment(v) for v in query.execute(doctor_id)]


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(
    appointment_id: str,
    query: GetAppointmentByIdQuery = Depends(get_appointment_by_id_query),
):
    try:
        return _serialize_appointment(query.execute(appointment_id))
    except AppointmentNotFound as e:
        raise HTTPException(status_code=404, detail="Appointment not found") from e


@router.get("/appointments", response_model=List[AppointmentResponse])
def list_appointments(
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    query: ListAppointmentsQuery = Depends(get_list_appointments_query),
):
    return [_serialize_appointment(v) for v in query.execute(patient_id, doctor_id)]
