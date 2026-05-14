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
    get_virus_genome,
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

    def _virus_genomes_ready(self) -> bool:
        genomes_dir = self.parent_dir / "virus_genomes"
        return (genomes_dir / "viral.genomes.fasta").is_file() and (genomes_dir / "genome2taxid.tsv").is_file()

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

    def install_virus_genomes(
        self,
        taxon: str = "Viruses",
        refseq: bool = True,
        skip_makeblastdb: bool = False,
        force: bool = True,
    ) -> tuple[Path, Path]:
        if force or not self._virus_genomes_ready():
            self._invoke(
                "get-databases virus-genome",
                get_virus_genome.callback,
                path=str(self.parent_dir),
                taxon=taxon,
                refseq=refseq,
                skip_makeblastdb=skip_makeblastdb,
            )
        genomes_dir = self.parent_dir / "virus_genomes"
        return genomes_dir / "viral.genomes.fasta", genomes_dir / "genome2taxid.tsv"

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

        total_steps = 7
        emit_progress(1, total_steps, "Installing Kraken2 database...")
        kraken2_database = self.install_kraken2(url=kraken2_url, force=force)
        emit_progress(2, total_steps, "Updating Krona taxonomy database...")
        krona_database = self.install_krona(force=force)
        emit_progress(3, total_steps, "Installing NCBI taxdump...")
        taxdump = self.install_taxdump(url=taxdump_url, force=force)
        emit_progress(4, total_steps, "Installing Diamond viral database...")
        diamond_database, taxids = self.install_diamond(
            taxon="Viruses",
            refseq=refseq,
            threads=threads,
            skip_makedb=False,
            force=force,
        )
        emit_progress(5, total_steps, "Installing viral genomes database...")
        viral_genomes, viral_taxids = self.install_virus_genomes(
            taxon="Viruses",
            refseq=refseq,
            skip_makeblastdb=False,
            force=force,
        )
        emit_progress(6, total_steps, "Installing host reference genome...")
        host_reference = self.install_host_genome(accession=host_accession, force=force)
        emit_progress(7, total_steps, "Installing Deacon index...")
        deacon_index_path = self.install_deacon_index(
            index_name=deacon_index,
            force=force,
        )

        return {
            "kraken2_database": str(kraken2_database),
            "krona_database": str(krona_database),
            "taxdump": str(taxdump),
            "diamond_database": str(diamond_database),
            "taxids": str(taxids),
            "viral_genomes": str(viral_genomes),
            "viral_taxids": str(viral_taxids),
            "host_reference": str(host_reference),
            "deacon_index": str(deacon_index_path),
        }
