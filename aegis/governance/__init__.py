"""Governance — the offline mirror of the Supabase audit/RLS spine.

The production governance lives in SQL (supabase/migrations/0002_governance.sql):
an append-only, hash-chained ``audit_log`` with ``audit_verify()`` for tamper
detection, enforced by triggers + RLS. This package re-implements the same
hash-chain integrity check in pure Python so the prototype's admin console can
show a real, tamper-detectable integrity badge while running offline on seed data.
"""
