from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from threading import Lock
from typing import Literal, Optional

StartupPhase = Literal[
    "starting",
    "bootstrapping_databases",
    "starting_worker",
    "ready",
    "degraded",
]


@dataclass
class StartupStatusSnapshot:
    phase: StartupPhase
    progress_step: int
    progress_total: int
    progress_text: str
    error: Optional[str]
    started_at: str
    updated_at: str

    def to_dict(self) -> dict[str, object]:
        return {
            "phase": self.phase,
            "progressStep": self.progress_step,
            "progressTotal": self.progress_total,
            "progressText": self.progress_text,
            "error": self.error,
            "startedAt": self.started_at,
            "updatedAt": self.updated_at,
        }


class StartupStatusService:
    def __init__(self) -> None:
        now = self._now_iso()
        self._lock = Lock()
        self._phase: StartupPhase = "starting"
        self._progress_step = 0
        self._progress_total = 0
        self._progress_text = "Backend starting..."
        self._error: Optional[str] = None
        self._started_at = now
        self._updated_at = now

    def _now_iso(self) -> str:
        return datetime.now().isoformat()

    def update(
        self,
        *,
        phase: Optional[StartupPhase] = None,
        progress_step: Optional[int] = None,
        progress_total: Optional[int] = None,
        progress_text: Optional[str] = None,
        error: Optional[str] = None,
    ) -> None:
        with self._lock:
            if phase is not None:
                self._phase = phase
            if progress_step is not None:
                self._progress_step = progress_step
            if progress_total is not None:
                self._progress_total = progress_total
            if progress_text is not None:
                self._progress_text = progress_text
            self._error = error
            self._updated_at = self._now_iso()

    def snapshot(self) -> StartupStatusSnapshot:
        with self._lock:
            return StartupStatusSnapshot(
                phase=self._phase,
                progress_step=self._progress_step,
                progress_total=self._progress_total,
                progress_text=self._progress_text,
                error=self._error,
                started_at=self._started_at,
                updated_at=self._updated_at,
            )


startup_status_service = StartupStatusService()
