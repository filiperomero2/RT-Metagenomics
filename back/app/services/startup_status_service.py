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
    download_label: Optional[str] = None
    download_loaded: Optional[str] = None
    download_total: Optional[str] = None
    download_speed: Optional[str] = None
    download_percent: Optional[int] = None

    def to_dict(self) -> dict[str, object]:
        payload: dict[str, object] = {
            "phase": self.phase,
            "progressStep": self.progress_step,
            "progressTotal": self.progress_total,
            "progressText": self.progress_text,
            "error": self.error,
            "startedAt": self.started_at,
            "updatedAt": self.updated_at,
        }
        if self.download_label:
            payload["downloadLabel"] = self.download_label
        if self.download_loaded:
            payload["downloadLoaded"] = self.download_loaded
        if self.download_total:
            payload["downloadTotal"] = self.download_total
        if self.download_speed:
            payload["downloadSpeed"] = self.download_speed
        if self.download_percent is not None:
            payload["downloadPercent"] = self.download_percent
        return payload


class StartupStatusService:
    def __init__(self) -> None:
        now = self._now_iso()
        self._lock = Lock()
        self._phase: StartupPhase = "starting"
        self._progress_step = 0
        self._progress_total = 0
        self._progress_text = "Backend starting..."
        self._error: Optional[str] = None
        self._download_label: Optional[str] = None
        self._download_loaded: Optional[str] = None
        self._download_total: Optional[str] = None
        self._download_speed: Optional[str] = None
        self._download_percent: Optional[int] = None
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
                self._download_label = None
                self._download_loaded = None
                self._download_total = None
                self._download_speed = None
                self._download_percent = None
            self._error = error
            self._updated_at = self._now_iso()

    def update_download(
        self,
        *,
        label: str,
        loaded: Optional[str] = None,
        total: Optional[str] = None,
        speed: Optional[str] = None,
        percent: Optional[int] = None,
    ) -> None:
        with self._lock:
            self._download_label = label
            self._download_loaded = loaded
            self._download_total = total
            self._download_speed = speed
            self._download_percent = percent
            self._updated_at = self._now_iso()

    def clear_download(self) -> None:
        with self._lock:
            self._download_label = None
            self._download_loaded = None
            self._download_total = None
            self._download_speed = None
            self._download_percent = None
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
                download_label=self._download_label,
                download_loaded=self._download_loaded,
                download_total=self._download_total,
                download_speed=self._download_speed,
                download_percent=self._download_percent,
            )


startup_status_service = StartupStatusService()
