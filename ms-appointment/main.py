from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import date
import redis
import json
import os
import asyncio
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client

import models
import schemas
from database import engine, get_db

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    eureka_server = os.getenv("EUREKA_SERVER", "http://ms-eureka:8761/eureka")
    await eureka_client.init_async(
        eureka_server=eureka_server,
        app_name="ms-appointment",
        instance_port=3003
    )
    yield

app = FastAPI(title="Appointment Microservice", description="Agendamiento de Citas Médicas", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/doctors/{doctor_id}/schedules", response_model=schemas.TimeBlockResponse, tags=["Schedules"])
def create_time_block(doctor_id: str, time_block: schemas.TimeBlockCreate, db: Session = Depends(get_db)):
    db_time_block = models.TimeBlock(**time_block.model_dump(exclude={"doctor_id"}), doctor_id=doctor_id)
    db.add(db_time_block)
    db.commit()
    db.refresh(db_time_block)
    return db_time_block

@app.get("/doctors/{doctor_id}/availability", response_model=List[schemas.TimeBlockResponse], tags=["Schedules"])
def get_availability(doctor_id: str, schedule_date: date, db: Session = Depends(get_db)):
    return db.query(models.TimeBlock).filter(
        models.TimeBlock.doctor_id == doctor_id,
        models.TimeBlock.schedule_date == schedule_date,
        models.TimeBlock.status == models.TimeBlockStatus.AVAILABLE
    ).all()

@app.post("/appointments", response_model=schemas.AppointmentResponse, tags=["Appointments"])
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # 1. Bloquear el TimeBlock (Transacción atómica simple MVP)
    time_block = db.query(models.TimeBlock).filter(models.TimeBlock.id == appointment.time_block_id).first()
    
    if not time_block:
        raise HTTPException(status_code=404, detail="TimeBlock not found")
    if time_block.status != models.TimeBlockStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="TimeBlock is not available")
    
    # 2. Crear cita
    db_appointment = models.Appointment(**appointment.model_dump())
    
    try:
        # Cambiar el estado del bloque asumiendo que db.commit lo atará
        time_block.status = models.TimeBlockStatus.OCCUPIED
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)
        
        # Enviar evento a redis queue para el ms-notification (US-026, 027)
        event_data = {
            "appointment_id": db_appointment.id,
            "patient_id": db_appointment.patient_id,
            "doctor_id": db_appointment.doctor_id,
            "type": db_appointment.care_type.value
        }
        redis_client.publish('appointment:created', json.dumps(event_data))
        
        return db_appointment
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not schedule appointment, slot might be taken")

@app.put("/appointments/{appointment_id}/cancel", response_model=schemas.AppointmentResponse, tags=["Appointments"])
def cancel_appointment(appointment_id: str, db: Session = Depends(get_db)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    appointment.status = models.AppointmentStatus.CANCELLED
    if appointment.time_block:
        appointment.time_block.status = models.TimeBlockStatus.AVAILABLE
        
    db.commit()
    db.refresh(appointment)
    
    # Enviar evento de cancelación
    event_data = {"appointment_id": appointment.id}
    redis_client.publish('appointment:cancelled', json.dumps(event_data))
    
    return appointment

@app.get("/doctors/{doctor_id}/appointments", response_model=List[schemas.AppointmentResponse], tags=["Appointments"])
def get_doctor_appointments(doctor_id: str, db: Session = Depends(get_db)):
    return db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id
    ).all()

from typing import List, Optional

@app.get("/appointments", response_model=List[schemas.AppointmentResponse], tags=["Appointments"])
def list_appointments(patient_id: Optional[str] = None, doctor_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Appointment)
    if patient_id:
        query = query.filter(models.Appointment.patient_id == patient_id)
    if doctor_id:
        query = query.filter(models.Appointment.doctor_id == doctor_id)
    return query.all()

@app.get("/doctors/{doctor_id}/schedules", response_model=List[schemas.TimeBlockResponse], tags=["Schedules"])
def get_doctor_schedules(
    doctor_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Return all time blocks (available + occupied) for a doctor. Optionally filter by date range."""
    query = db.query(models.TimeBlock).filter(models.TimeBlock.doctor_id == doctor_id)
    if date_from:
        query = query.filter(models.TimeBlock.schedule_date >= date_from)
    if date_to:
        query = query.filter(models.TimeBlock.schedule_date <= date_to)
    return query.order_by(models.TimeBlock.schedule_date, models.TimeBlock.start_time).all()

