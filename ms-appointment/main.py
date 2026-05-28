from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.infrastructure.api.appointments_router import router as appointments_router
from app.infrastructure.api.schedules_router import router as schedules_router
from app.infrastructure.discovery.eureka import register_with_eureka
from app.infrastructure.persistence.database import Base, engine
from app.infrastructure.persistence import orm_models  # noqa: F401 - register models with Base

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await register_with_eureka()
    yield


app = FastAPI(
    title="Appointment Microservice",
    description="Agendamiento de Citas Médicas (DDD + Hexagonal)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedules_router)
app.include_router(appointments_router)
