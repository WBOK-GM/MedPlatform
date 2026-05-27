from abc import ABC, abstractmethod
from typing import Any, Dict, Iterable, Optional

from ..events import DomainEvent


class EventPublisherPort(ABC):
    @abstractmethod
    def publish_all(
        self,
        events: Iterable[DomainEvent],
        notification_payload: Optional[Dict[str, Any]] = None,
    ) -> None: ...
