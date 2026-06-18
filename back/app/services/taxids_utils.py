import os
from pathlib import Path


def resolve_taxids_path(
    diamond_database: str | None,
    taxids: str | None = None,
) -> str | None:
    """Resolve protein2taxid.tsv from an explicit path or the Diamond database directory."""
    if taxids and str(taxids).strip():
        return str(taxids).strip()

    if not diamond_database or not str(diamond_database).strip():
        return None

    candidate = Path(diamond_database).resolve().parent / "protein2taxid.tsv"
    if candidate.is_file():
        return str(candidate)

    return None


def taxids_file_exists(taxids_path: str | None) -> bool:
    if not taxids_path:
        return False
    return os.path.isfile(taxids_path)
