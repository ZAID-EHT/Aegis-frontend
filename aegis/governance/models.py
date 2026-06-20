"""Governance view types for the admin console (approvals + override-watch)."""

from __future__ import annotations

from dataclasses import dataclass

from aegis.governance.audit import AuditEntry


@dataclass(frozen=True)
class PendingApproval:
    request_id: str
    full_name: str
    email: str
    role_requested: str
    requested_at: str


@dataclass(frozen=True)
class OverrideRecord:
    team_id: str
    lecturer: str
    from_status: str
    to_status: str
    reason: str
    at: str


@dataclass(frozen=True)
class GovernanceData:
    audit: list[AuditEntry]  # hash-chained
    approvals: list[PendingApproval]
    overrides: list[OverrideRecord]
