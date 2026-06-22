import os
import re


def is_wsl_mode() -> bool:
    return os.environ.get("RT_META_WSL") == "1"


def to_wsl_path(path: str | None) -> str | None:
    if path is None:
        return None

    normalized = path.strip()
    if not normalized:
        return normalized

    if normalized.startswith("/"):
        return normalized

    drive_match = re.match(r"^([A-Za-z]):[/\\]?(.*)$", normalized)
    if drive_match:
        drive = drive_match.group(1).lower()
        rest = drive_match.group(2).replace("\\", "/").strip("/")
        return f"/mnt/{drive}/{rest}" if rest else f"/mnt/{drive}"

    return normalized.replace("\\", "/")


def normalize_path(path: str | None) -> str | None:
    if path is None or not is_wsl_mode():
        return path
    return to_wsl_path(path)
