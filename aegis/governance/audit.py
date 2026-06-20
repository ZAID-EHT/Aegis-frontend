"""Hash-chained audit log + integrity check — the Python mirror of the SQL spine.

Each entry commits to the previous one via a SHA-256 chain (``row_hash`` covers
``prev_hash`` + the entry's fields). Any edit or deletion breaks the chain, which
``verify`` detects by recomputing it — exactly what ``audit_verify()`` does in
0002_governance.sql. The canonical serialisation here is our own (not byte-identical
to Postgres' ``digest``); the two are independent enforcement layers.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Sequence
from dataclasses import dataclass, field, replace
from typing import Any

GENESIS = "GENESIS"


@dataclass(frozen=True)
class AuditEntry:
    id: int
    actor_id: str
    actor_role: str
    action: str
    created_at: str  # ISO timestamp (passed in; the engine never reads the clock)
    target_type: str | None = None
    target_id: str | None = None
    reason: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    prev_hash: str | None = None
    row_hash: str | None = None


def _digest(prev_hash: str, entry: AuditEntry) -> str:
    # Structured JSON (not a delimiter join) so a value containing the separator
    # cannot forge a colliding payload. EVERY security-relevant field is covered —
    # incl. id, actor_role and target_type — so renumbering or a privilege-flip is
    # detected, not just a reason edit. None stays distinct from "" (json null).
    payload = json.dumps(
        [
            prev_hash,
            entry.id,
            entry.actor_id,
            entry.actor_role,
            entry.action,
            entry.target_type,
            entry.target_id,
            entry.reason,
            entry.metadata,
            entry.created_at,
        ],
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_chain(entries: Sequence[AuditEntry]) -> list[AuditEntry]:
    """Stamp prev_hash/row_hash onto each entry in order (as inserts would)."""
    chained: list[AuditEntry] = []
    prev = GENESIS
    for entry in entries:
        row_hash = _digest(prev, entry)
        chained.append(replace(entry, prev_hash=prev, row_hash=row_hash))
        prev = row_hash
    return chained


def verify(entries: Sequence[AuditEntry]) -> int | None:
    """Recompute the chain; return the id of the first broken row, or None if intact."""
    prev = GENESIS
    for entry in entries:
        calc = _digest(prev, entry)
        if calc != entry.row_hash or entry.prev_hash != prev:
            return entry.id
        prev = entry.row_hash
    return None
