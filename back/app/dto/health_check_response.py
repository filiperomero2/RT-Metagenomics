from typing import Optional
from datetime import datetime


class HealthCheckResponse:
    def __init__(self, status: str = "UP", timestamp: Optional[datetime] = None):
        self.status = status
        self.timestamp = timestamp or datetime.now()

    def dict(self):
        return {
            "status": self.status,
            "timestamp": self.timestamp.isoformat()
        } 