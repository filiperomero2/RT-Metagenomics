import os
from functools import lru_cache
from typing import Dict, Optional, Tuple

NodesMap = Dict[str, Tuple[str, str]]


@lru_cache(maxsize=4)
def load_taxdump_nodes(taxdump_dir: str) -> NodesMap:
    """Load NCBI taxdump nodes.dmp into taxid -> (parent_taxid, rank)."""
    nodes_file = os.path.join(taxdump_dir, "nodes.dmp")
    nodes: NodesMap = {}
    with open(nodes_file) as f:
        for line in f:
            parts = line.split("|")
            taxid = parts[0].strip()
            parent = parts[1].strip()
            rank = parts[2].strip()
            nodes[taxid] = (parent, rank)
    return nodes


def get_taxid_at_rank(taxid_str: str, target_rank: str, nodes: NodesMap) -> Optional[str]:
    """Walk upward and return the taxid at target_rank, or None."""
    visited: set[str] = set()
    current = taxid_str
    while current and current not in visited:
        visited.add(current)
        if current not in nodes:
            break
        parent, rank = nodes[current]
        if rank == target_rank:
            return current
        if current == parent:
            break
        current = parent
    return None
