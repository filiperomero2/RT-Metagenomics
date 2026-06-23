from pathlib import Path

import click
from typing import Callable, Optional

from viralunity.viralunity_get_databases_cli import (
    get_deacon_index,
    get_diamond,
    get_host_genome,
    get_kraken2,
    get_krona,
    get_taxdump,
)


class ViralUnityDatabasesService:
    def __init__(self, parent_dir: Path) -> None:
        self.parent_dir = parent_dir
        self.parent_dir.mkdir(parents=True, exist_ok=True)

    def _invoke(self, command_name: str, callback, **kwargs) -> None:
        try:
            callback(**kwargs)
        except click.ClickException as exc:
            raise RuntimeError(f"ViralUnity {command_name} failed: {exc}") from exc
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"ViralUnity {command_name} failed: {exc}") from exc

    def _kraken2_ready(self) -> bool:
        return (self.parent_dir / "kraken2" / "hash.k2d").is_file()

    def _krona_ready(self) -> bool:
        return (self.parent_dir / "krona" / "taxonomy" / "names.dmp").is_file()

    def _taxdump_ready(self) -> bool:
        taxdump_dir = self.parent_dir / "taxdump"
        return (taxdump_dir / "nodes.dmp").is_file() and (taxdump_dir / "names.dmp").is_file()

    def _diamond_ready(self) -> bool:
        diamond_dir = self.parent_dir / "diamond"
        return (diamond_dir / "viral.dmnd").is_file() and (diamond_dir / "protein2taxid.tsv").is_file()

    def _host_genome_ready(self, accession: str) -> bool:
        return (self.parent_dir / "host_genomes" / f"{accession}.fasta").is_file()

    def _deacon_ready(self, index_name: str) -> bool:
        return (self.parent_dir / "deacon_indexes" / f"{index_name}.idx").is_file()

    def install_kraken2(self, url: str, force: bool = True) -> Path:
        if force or not self._kraken2_ready():
            self._invoke(
                "get-databases kraken2",
                get_kraken2.callback,
                path=str(self.parent_dir),
                url=url,
            )
        return self.parent_dir / "kraken2"

    def install_krona(self, force: bool = True) -> Path:
        if force or not self._krona_ready():
            self._invoke(
                "get-databases krona",
                get_krona.callback,
                path=str(self.parent_dir),
            )
        return self.parent_dir / "krona" / "taxonomy"

    def install_taxdump(self, url: str, force: bool = True) -> Path:
        if force or not self._taxdump_ready():
            self._invoke(
                "get-databases taxdump",
                get_taxdump.callback,
                path=str(self.parent_dir),
                url=url,
            )
        return self.parent_dir / "taxdump"

    def install_diamond(
        self,
        taxon: str = "Viruses",
        refseq: bool = True,
        threads: int = 4,
        skip_makedb: bool = False,
        force: bool = True,
    ) -> tuple[Path, Path]:
        if force or not self._diamond_ready():
            self._invoke(
                "get-databases diamond",
                get_diamond.callback,
                path=str(self.parent_dir),
                taxon=taxon,
                refseq=refseq,
                threads=threads,
                skip_makedb=skip_makedb,
            )
        diamond_dir = self.parent_dir / "diamond"
        return diamond_dir / "viral.dmnd", diamond_dir / "protein2taxid.tsv"

    def install_host_genome(self, accession: str, force: bool = True) -> Path:
        if force or not self._host_genome_ready(accession):
            self._invoke(
                "get-databases host-genome",
                get_host_genome.callback,
                path=str(self.parent_dir),
                accession=accession,
            )
        return self.parent_dir / "host_genomes" / f"{accession}.fasta"

    def install_deacon_index(self, index_name: str = "panhuman-1", force: bool = True) -> Path:
        if force or not self._deacon_ready(index_name):
            self._invoke(
                "get-databases deacon-index",
                get_deacon_index.callback,
                path=str(self.parent_dir),
                index_name=index_name,
            )
        return self.parent_dir / "deacon_indexes" / f"{index_name}.idx"

    def install_all(
        self,
        threads: int = 4,
        refseq: bool = True,
        force: bool = False,
        on_progress: Optional[Callable[[int, int, str], None]] = None,
    ) -> dict[str, str]:
        host_accession = "GCA_000001405.29"
        deacon_index = "panhuman-1"
        kraken2_url = "https://genome-idx.s3.amazonaws.com/kraken/k2_viral_20240112.tar.gz"
        taxdump_url = "https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/taxdump.tar.gz"

        def emit_progress(step: int, total: int, message: str) -> None:
            if on_progress is not None:
                on_progress(step, total, message)

        total_steps = 5
        errors: list[str] = []
        paths: dict[str, str] = {}

        def run_step(step: int, label: str, action: Callable[[], tuple[str, str]]) -> None:
            emit_progress(step, total_steps, label)
            try:
                key, value = action()
                paths[key] = value
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{label}: {exc}")

        run_step(
            1,
            "Installing Kraken2 database...",
            lambda: (
                "kraken2_database",
                str(self.install_kraken2(url=kraken2_url, force=force)),
            ),
        )
        run_step(
            2,
            "Updating Krona taxonomy database...",
            lambda: ("krona_database", str(self.install_krona(force=force))),
        )
        run_step(
            3,
            "Installing NCBI taxdump...",
            lambda: ("taxdump", str(self.install_taxdump(url=taxdump_url, force=force))),
        )
        run_step(
            4,
            "Installing Diamond viral database...",
            lambda: (
                "diamond_database",
                str(
                    self.install_diamond(
                        taxon="Viruses",
                        refseq=refseq,
                        threads=threads,
                        skip_makedb=False,
                        force=force,
                    )[0],
                ),
            ),
        )
        run_step(
            5,
            "Installing Deacon index...",
            lambda: (
                "deacon_index",
                str(self.install_deacon_index(index_name=deacon_index, force=force)),
            ),
        )

        if "taxids" not in paths and "diamond_database" in paths:
            paths["taxids"] = str(self.parent_dir / "diamond" / "protein2taxid.tsv")

        if errors:
            raise RuntimeError(
                "One or more database installs failed:\n" + "\n".join(f"- {item}" for item in errors)
            )

        return paths
