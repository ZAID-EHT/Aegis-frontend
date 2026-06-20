"""Governance adapter: governance.json -> chained audit + admin-console views.

Impure edge (file I/O). Loads the synthetic governance data and stamps the audit
hash chain via ``build_chain`` so ``verify`` can detect tampering — mirroring how
the SQL trigger writes ``row_hash`` on insert.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from aegis.governance.audit import AuditEntry
from aegis.governance.models import GovernanceData, OverrideRecord, PendingApproval

DEFAULT_GOVERNANCE: Path = Path(__file__).resolve().parents[1] / "seed" / "governance.json"


def _entry(raw: dict[str, Any]) -> AuditEntry:
    # Load the STORED prev_hash/row_hash (written at insert time, like the SQL
    # trigger) rather than recomputing — so verify() compares stored vs recomputed
    # and actually detects tampering of the seed file, not just in-memory mutation.
    return AuditEntry(
        id=int(raw["id"]),
        actor_id=str(raw["actor_id"]),
        actor_role=str(raw["actor_role"]),
        action=str(raw["action"]),
        created_at=str(raw["created_at"]),
        target_type=raw.get("target_type"),
        target_id=raw.get("target_id"),
        reason=raw.get("reason"),
        metadata=dict(raw.get("metadata", {})),
        prev_hash=raw.get("prev_hash"),
        row_hash=raw.get("row_hash"),
    )


def load_governance(path: str | Path = DEFAULT_GOVERNANCE) -> GovernanceData:
    data: Any = json.loads(Path(path).read_text(encoding="utf-8"))
    audit = [_entry(e) for e in data["audit"]]
    approvals = [
        PendingApproval(
            request_id=str(a["request_id"]),
            full_name=str(a["full_name"]),
            email=str(a["email"]),
            role_requested=str(a["role_requested"]),
            requested_at=str(a["requested_at"]),
        )
        for a in data.get("approvals", [])
    ]
    overrides = [
        OverrideRecord(
            team_id=str(o["team_id"]),
            lecturer=str(o["lecturer"]),
            from_status=str(o["from_status"]),
            to_status=str(o["to_status"]),
            reason=str(o["reason"]),
            at=str(o["at"]),
        )
        for o in data.get("overrides", [])
    ]
    return GovernanceData(audit=audit, approvals=approvals, overrides=overrides)
