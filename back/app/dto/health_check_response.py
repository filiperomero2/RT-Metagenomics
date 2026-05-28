from typing import Any, Optional
from datetime import datetime


class HealthCheckResponse:
    def __init__(
        self,
        status: str = "UP",
        timestamp: Optional[datetime] = None,
        startup: Optional[dict[str, Any]] = None,
    ):
        self.status = status
        self.timestamp = timestamp or datetime.now()
        self.startup = startup or {}

    def dict(self):
        payload = {
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
        } 
        payload.update(self.startup)
        return payload