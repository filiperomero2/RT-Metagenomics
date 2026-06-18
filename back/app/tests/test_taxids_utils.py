import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock

sys.modules.setdefault("viralunity", MagicMock())
sys.modules.setdefault("viralunity.viralunity_meta", MagicMock())

from services.taxids_utils import resolve_taxids_path, taxids_file_exists  # noqa: E402


class TestTaxidsUtils(unittest.TestCase):
    def test_resolve_from_explicit_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            taxids_path = os.path.join(tmp, "custom.tsv")
            with open(taxids_path, "w") as handle:
                handle.write("protein\ttaxid\n")

            resolved = resolve_taxids_path(
                os.path.join(tmp, "viral.dmnd"),
                taxids_path,
            )
            self.assertEqual(resolved, taxids_path)

    def test_resolve_from_diamond_database_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            taxids_path = os.path.join(tmp, "protein2taxid.tsv")
            with open(taxids_path, "w") as handle:
                handle.write("protein\ttaxid\n")

            resolved = resolve_taxids_path(os.path.join(tmp, "viral.dmnd"), None)
            self.assertEqual(resolved, taxids_path)

    def test_resolve_returns_none_when_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            resolved = resolve_taxids_path(os.path.join(tmp, "viral.dmnd"), None)
            self.assertIsNone(resolved)
            self.assertFalse(taxids_file_exists(resolved))


if __name__ == "__main__":
    unittest.main()
