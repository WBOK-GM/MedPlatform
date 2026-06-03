import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    kafka_bootstrap_servers: str
    service_port: int


settings = Settings(
    kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
    service_port=int(os.getenv("SERVICE_PORT", "3003")),
)
