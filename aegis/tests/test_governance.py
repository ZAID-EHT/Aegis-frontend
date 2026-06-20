"""Tests for the hash-chained audit log + integrity check (mirror of audit_verify())."""

from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

from aegis.adapters.repo_governance import DEFAULT_GOVERNANCE, load_governance
from aegis.governance.audit import GENESIS, AuditEntry, build_chain, verify


def _entries() -> list[AuditEntry]:
    return [
        AuditEntry(id=1, actor_id="a", actor_role="admin", action="login", created_at="t1"),
        AuditEntry(
            id=2, actor_id="a", actor_role="admin", action="role_changed",
            created_at="t2", target_id="u1", metadata={"to": "lecturer"},
        ),
        AuditEntry(
            id=3, actor_id="u1", actor_role="lecturer", action="allocation_run", created_at="t3",
        ),
    ]


def test_chain_links_genesis_then_prior() -> None:
    chain = build_chain(_entries())
    assert chain[0].prev_hash == GENESIS
    assert chain[1].prev_hash == chain[0].row_hash
    assert chain[2].prev_hash == chain[1].row_hash
    assert all(e.row_hash for e in chain)


def test_intact_chain_verifies() -> None:
    assert verify(build_chain(_entries())) is None


def test_tampered_reason_is_detected() -> None:
    chain = build_chain(_entries())
    chain[1] = replace(chain[1], reason="tampered")  # mutate field, keep stale row_hash
    assert verify(chain) == 2


def test_deleted_row_breaks_chain() -> None:
    chain = build_chain(_entries())
    del chain[1]  # removing a link breaks the prev_hash linkage at the next row
    assert verify(chain) == 3


def test_tampered_actor_role_is_detected() -> None:
    """A privilege-flip (lecturer -> admin) must break the chain — actor_role is hashed."""
    chain = build_chain(_entries())
    chain[2] = replace(chain[2], actor_role="admin")
    assert verify(chain) == 3


def test_reordered_rows_are_detected() -> None:
    chain = build_chain(_entries())
    chain[0], chain[1] = chain[1], chain[0]  # swap -> first row's prev_hash != GENESIS
    assert verify(chain) is not None


def test_forged_prev_hash_is_detected() -> None:
    chain = build_chain(_entries())
    chain[1] = replace(chain[1], prev_hash="deadbeef")  # broken linkage, row_hash stale
    assert verify(chain) == 2


def test_delimiter_injection_does_not_collide() -> None:
    """Two logically different entries must not hash the same via separator games."""
    a = build_chain([replace(_entries()[0], reason="foo", target_id="bar")])
    b = build_chain([replace(_entries()[0], reason="foo|bar", target_id=None)])
    assert a[0].row_hash != b[0].row_hash


def test_seed_governance_loads_and_is_intact() -> None:
    gov = load_governance()
    assert len(gov.audit) == 6
    assert len(gov.approvals) == 2
    assert len(gov.overrides) == 1
    assert verify(gov.audit) is None  # the seeded chain is intact


def test_seed_file_tamper_is_detected(tmp_path: Path) -> None:
    """Editing governance.json without recomputing its stored hash is caught — the
    integrity check verifies STORED hashes, it doesn't silently re-chain on load."""
    data = json.loads(Path(DEFAULT_GOVERNANCE).read_text(encoding="utf-8"))
    data["audit"][4]["reason"] = "forged reason"  # id 5, leave its row_hash untouched
    tampered = tmp_path / "governance.json"
    tampered.write_text(json.dumps(data), encoding="utf-8")
    gov = load_governance(tampered)
    assert verify(gov.audit) == 5
