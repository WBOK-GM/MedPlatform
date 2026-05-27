import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    redis_url: str
    eureka_server: str
    service_port: int


settings = Settings(
    redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    eureka_server=os.getenv("EUREKA_SERVER", "http://ms-eureka:8761/eureka"),
    service_port=int(os.getenv("SERVICE_PORT", "3003")),
)
