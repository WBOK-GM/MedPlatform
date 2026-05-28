import py_eureka_client.eureka_client as eureka_client

from ...config import settings


async def register_with_eureka() -> None:
    await eureka_client.init_async(
        eureka_server=settings.eureka_server,
        app_name="ms-appointment",
        instance_port=settings.service_port,
    )
