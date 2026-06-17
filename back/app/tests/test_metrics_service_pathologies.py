import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock

# Stub viralunity before services package __init__ pulls it in.
sys.modules.setdefault("viralunity", MagicMock())
sys.modules.setdefault("viralunity.viralunity_meta", MagicMock())

from services.metrics_service import MetricsService  # noqa: E402
from services.paths_service import PathsService  # noqa: E402


def _write_taxdump(directory: str) -> None:
    nodes = "\n".join(
        [
            "1|1|no rank|",
            "100|1|family|",
            "200|100|genus|",
            "300|200|species|",
            "400|200|species|",
            "500|1|family|",
            "600|500|species|",
        ]
    )
    with open(os.path.join(directory, "nodes.dmp"), "w") as f:
        f.write(nodes + "\n")
    with open(os.path.join(directory, "names.dmp"), "w") as f:
        f.write("")


def _write_bleed_tsv(path: str) -> None:
    header = (
        "sample\ttool\tmode\trank\ttaxid\tname\tcount\tpercent\trpm\t"
        "total_reads\tmax_rpm\tbleed_threshold\tbleed_applied\tbleed_pass\n"
    )
    rows = [
        "sample-test\tkraken2\treads\tfamily\t100\tCoronaviridae\t1000\t90.0\t500\t2000\t500\t2.5\tTrue\tTrue",
        "sample-test\tkraken2\treads\tspecies\t300\tSpecies A\t800\t72.0\t400\t2000\t500\t2.5\tTrue\tTrue",
        "sample-test\tkraken2\treads\tspecies\t400\tSpecies B\t100\t9.0\t50\t2000\t500\t2.5\tTrue\tTrue",
        "sample-test\tkraken2\treads\tspecies\t600\tOrphan virus\t50\t5.0\t25\t2000\t25\t0.125\tFalse\tTrue",
        "sample-test\tkraken2\treads\tfamily\t100\tCoronaviridae\t999\t0.0\t0\t2000\t500\t2.5\tTrue\tFalse",
        "sample-other\tkraken2\treads\tfamily\t100\tCoronaviridae\t5000\t100.0\t1000\t1000\t1000\t5\tTrue\tTrue",
    ]
    with open(path, "w") as f:
        f.write(header + "\n".join(rows) + "\n")


class TestProcessPathologyFromTaxaSummary(unittest.TestCase):
    def setUp(self):
        self.service = MetricsService(PathsService())
        self.tmp = tempfile.TemporaryDirectory()
        self.taxdump_dir = os.path.join(self.tmp.name, "taxdump")
        os.makedirs(self.taxdump_dir)
        _write_taxdump(self.taxdump_dir)
        self.summary_path = os.path.join(self.tmp.name, "summary.bleed.tsv")
        _write_bleed_tsv(self.summary_path)

    def tearDown(self):
        self.tmp.cleanup()
        from services.taxonomy_utils import load_taxdump_nodes

        load_taxdump_nodes.cache_clear()

    def test_builds_families_and_species_for_sample(self):
        result = self.service._process_pathology_data_from_taxa_summary(
            self.summary_path, "test", self.taxdump_dir
        )

        self.assertEqual(len(result), 1)
        corona = next(p for p in result if p["name"] == "Coronaviridae")
        self.assertEqual(corona["nReads"], 1000)
        self.assertEqual(len(corona["pathogens"]), 2)
        self.assertEqual(corona["pathogens"][0]["pathogen"], "Species A")
        self.assertEqual(corona["pathogens"][0]["nReads"], 800)
        self.assertEqual(corona["pathogens"][1]["pathogen"], "Species B")
        self.assertEqual(corona["pathogens"][1]["nReads"], 100)

    def test_bleed_pass_false_excluded(self):
        result = self.service._process_pathology_data_from_taxa_summary(
            self.summary_path, "test", self.taxdump_dir
        )
        corona = next(p for p in result if p["name"] == "Coronaviridae")
        self.assertEqual(corona["nReads"], 1000)

    def test_orphan_species_without_family_row_ignored(self):
        result = self.service._process_pathology_data_from_taxa_summary(
            self.summary_path, "test", self.taxdump_dir
        )
        names = {p["name"] for p in result}
        self.assertNotIn("Poxviridae", names)
        self.assertEqual(len(result), 1)

    def test_other_sample_rows_ignored(self):
        result = self.service._process_pathology_data_from_taxa_summary(
            self.summary_path, "test", self.taxdump_dir
        )
        total_reads = sum(p["nReads"] for p in result)
        self.assertEqual(total_reads, 1000)

    def test_without_taxdump_families_have_no_pathogens(self):
        result = self.service._process_pathology_data_from_taxa_summary(
            self.summary_path, "test", None
        )
        for pathology in result:
            self.assertEqual(pathology["pathogens"], [])


if __name__ == "__main__":
    unittest.main()
