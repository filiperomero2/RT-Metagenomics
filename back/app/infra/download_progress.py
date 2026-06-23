from __future__ import annotations

import re
import threading
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

from services.startup_status_service import startup_status_service

_DATASETS_DOWNLOAD_RE = re.compile(
    r"Downloading:\s+(?P<file>\S+)\s+(?P<loaded>[\d.]+(?:MB|GB|KB|B))\s+(?P<speed>[\d.]+(?:kB|MB|GB|B)/s)",
    re.IGNORECASE,
)
_FETCHING_RE = re.compile(r"^Fetching\s+(?P<url>\S+)", re.IGNORECASE)
_WGET_LENGTH_RE = re.compile(
    r"Length:\s+(?P<bytes>\d+)\s+\((?P<human>[^)]+)\)",
    re.IGNORECASE,
)
_WGET_PROGRESS_RE = re.compile(
    r"(?P<pct>\d+)%[^\d]*(?P<loaded>[\d.]+\s*[KMG]?B)\s+(?P<speed>[\d.]+\s*[kKMGT]?B/s)",
    re.IGNORECASE,
)
_ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")

_last_download_signature: Optional[str] = None
_last_polled_size: Optional[int] = None
_download_total_bytes: Optional[int] = None
_active_download_path: Optional[str] = None
_registered_target_label: Optional[str] = None
_registered_is_directory = False
_poll_thread: Optional[threading.Thread] = None
_poll_stop: Optional[threading.Event] = None


def strip_ansi(text: str) -> str:
    return _ANSI_ESCAPE_RE.sub("", text).replace("\r", "").strip()


def format_bytes(num_bytes: int) -> str:
    if num_bytes < 1024:
        return f"{num_bytes} B"

    size = float(num_bytes)
    for unit in ("KB", "MB", "GB", "TB"):
        size /= 1024
        if size < 1024:
            return f"{size:.2f} {unit}"

    return f"{size:.2f} PB"


def parse_human_size(value: str) -> Optional[int]:
    match = re.match(
        r"(?P<num>[\d.]+)\s*(?P<unit>B|KB|MB|GB|TB|kB)",
        value.strip(),
        re.IGNORECASE,
    )
    if not match:
        return None

    num = float(match.group("num"))
    unit = match.group("unit").upper()
    if unit == "B":
        return int(num)
    if unit == "KB":
        return int(num * 1024)
    if unit == "MB":
        return int(num * 1024**2)
    if unit == "GB":
        return int(num * 1024**3)
    if unit == "TB":
        return int(num * 1024**4)
    return None


def _safe_file_size(path: str) -> Optional[int]:
    try:
        return Path(path).stat().st_size
    except OSError:
        return None


def _directory_size(path: str) -> int:
    root = Path(path)
    if not root.exists():
        return 0

    total = 0
    for item in root.rglob("*"):
        if item.is_file():
            try:
                total += item.stat().st_size
            except OSError:
                continue
    return total


def _resolve_download_size(path: str) -> Optional[int]:
    if _registered_is_directory:
        size = _directory_size(path)
        return size if size > 0 else None

    candidates = [
        path,
        f"{path}.part",
        f"{path}.tmp",
        f"{path}.crdownload",
    ]
    sizes = [_safe_file_size(candidate) for candidate in candidates]
    present = [size for size in sizes if size is not None]
    return max(present) if present else None


def _current_download_size() -> Optional[int]:
    if not _active_download_path:
        return None
    return _resolve_download_size(_active_download_path)


def _head_content_length(url: str) -> Optional[int]:
    try:
        request = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(request, timeout=5) as response:
            content_length = response.headers.get("Content-Length")
            if content_length:
                return int(content_length)
    except (urllib.error.URLError, ValueError, TimeoutError):
        return None
    return None


def register_download_target(
    path: str,
    label: Optional[str] = None,
    *,
    is_directory: bool = False,
) -> None:
    global _active_download_path, _registered_target_label, _last_polled_size
    global _registered_is_directory

    _active_download_path = path
    _registered_target_label = label or Path(path).name
    _registered_is_directory = is_directory
    _last_polled_size = None


def prefetch_download_total(url: str) -> None:
    threading.Thread(target=_apply_total_from_url, args=(url,), daemon=True).start()


def begin_download_polling() -> None:
    global _poll_thread, _poll_stop, _last_polled_size

    if not _active_download_path or _poll_thread is not None:
        return

    _last_polled_size = None
    _poll_stop = threading.Event()

    def poll_loop() -> None:
        assert _poll_stop is not None
        while not _poll_stop.wait(1.5):
            _poll_download_size_once()

    _poll_thread = threading.Thread(target=poll_loop, daemon=True)
    _poll_thread.start()


def end_download_polling() -> None:
    global _poll_thread, _poll_stop

    if _poll_stop is not None:
        _poll_stop.set()

    if _poll_thread is not None:
        _poll_thread.join(timeout=2)
        _poll_thread = None

    _poll_stop = None
    _poll_download_size_once(force=True)


def _poll_download_size_once(*, force: bool = False) -> None:
    global _last_polled_size

    if not _active_download_path:
        return

    size = _current_download_size()
    if size is None:
        return
    if not force and size == _last_polled_size:
        return

    _last_polled_size = size
    label = _registered_target_label or Path(_active_download_path).name
    _publish_download(label=label, loaded_bytes=size)


def _apply_total_from_url(url: str, label: Optional[str] = None) -> None:
    total_bytes = _head_content_length(url)
    if total_bytes is None:
        return

    global _download_total_bytes
    _download_total_bytes = total_bytes
    resolved_label = label or _registered_target_label or url.rsplit("/", 1)[-1]
    _publish_download(
        label=resolved_label,
        loaded_bytes=_current_download_size(),
        total_bytes=total_bytes,
    )


def _publish_download(
    *,
    label: str,
    loaded_bytes: Optional[int],
    speed: Optional[str] = None,
    total_bytes: Optional[int] = None,
) -> None:
    global _download_total_bytes

    if total_bytes is not None:
        _download_total_bytes = total_bytes

    total = _download_total_bytes
    loaded = loaded_bytes

    if loaded is None and _active_download_path:
        loaded = _current_download_size()

    percent: Optional[int] = None
    if loaded is not None and total and total > 0:
        percent = min(100, int(loaded * 100 / total))

    startup_status_service.update_download(
        label=label,
        loaded=format_bytes(loaded) if loaded is not None else None,
        total=format_bytes(total) if total else None,
        speed=speed,
        percent=percent,
    )


def report_subprocess_line(raw_line: str) -> None:
    global _last_download_signature, _download_total_bytes, _active_download_path
    global _registered_target_label

    line = strip_ansi(raw_line)
    if not line:
        return

    wget_length_match = _WGET_LENGTH_RE.search(line)
    if wget_length_match:
        total_bytes = int(wget_length_match.group("bytes"))
        label = _registered_target_label or "download"
        _publish_download(
            label=label,
            loaded_bytes=_current_download_size(),
            total_bytes=total_bytes,
        )
        return

    datasets_match = _DATASETS_DOWNLOAD_RE.search(line)
    if datasets_match:
        loaded = datasets_match.group("loaded")
        speed = datasets_match.group("speed")
        file_path = datasets_match.group("file")
        file_name = _registered_target_label or file_path.rsplit("/", 1)[-1]
        _active_download_path = file_path

        loaded_bytes = _current_download_size() or parse_human_size(loaded)
        signature = f"{file_name}|{loaded_bytes}|{speed}|{_download_total_bytes}"
        if signature == _last_download_signature:
            return
        _last_download_signature = signature
        _publish_download(label=file_name, loaded_bytes=loaded_bytes, speed=speed)
        return

    wget_progress_match = _WGET_PROGRESS_RE.search(line)
    if wget_progress_match:
        loaded = wget_progress_match.group("loaded").replace(" ", "")
        speed = wget_progress_match.group("speed").replace(" ", "")
        label = _registered_target_label or (
            _active_download_path.rsplit("/", 1)[-1] if _active_download_path else "download"
        )
        loaded_bytes = parse_human_size(loaded)
        if _active_download_path and loaded_bytes is None:
            loaded_bytes = _current_download_size()

        signature = f"wget|{label}|{loaded_bytes}|{speed}|{_download_total_bytes}"
        if signature == _last_download_signature:
            return
        _last_download_signature = signature
        _publish_download(label=label, loaded_bytes=loaded_bytes, speed=speed)
        return

    fetch_match = _FETCHING_RE.match(line)
    if fetch_match:
        url = fetch_match.group("url")
        label = _registered_target_label or url.rsplit("/", 1)[-1]
        signature = f"fetch|{label}|{_active_download_path}"
        if signature == _last_download_signature:
            return
        _last_download_signature = signature

        threading.Thread(
            target=_apply_total_from_url,
            args=(url, label),
            daemon=True,
        ).start()
        _publish_download(label=label, loaded_bytes=_current_download_size())
        return

    if line.startswith("Saving to:"):
        save_match = re.search(r"Saving to:\s+'(?P<path>[^']+)'", line)
        if save_match:
            saved_path = save_match.group("path")
            _active_download_path = saved_path
            if not _registered_target_label:
                _registered_target_label = Path(saved_path).name
        return


def clear_download_progress() -> None:
    global _last_download_signature, _last_polled_size, _download_total_bytes
    global _active_download_path, _registered_target_label, _registered_is_directory

    end_download_polling()
    _last_download_signature = None
    _last_polled_size = None
    _download_total_bytes = None
    _active_download_path = None
    _registered_target_label = None
    _registered_is_directory = False
    startup_status_service.clear_download()
