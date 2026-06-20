"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldX, UserCheck, GitPullRequestArrow, ScrollText } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import {
  type ApprovalView,
  type AuditView,
  type IntegrityView,
  type OverrideView,
  getApprovals,
  getAudit,
  getIntegrity,
  getOverrides,
} from "@/lib/api";

function IntegrityBadge({ integrity }: { integrity: IntegrityView | null }) {
  if (!integrity) {
    return (
      <div className="rounded-[1.25rem] bg-card p-5 shadow-card text-sm text-muted-foreground">
        Checking audit-log integrity…
      </div>
    );
  }
  const ok = integrity.verified;
  const color = ok ? "var(--healthy)" : "var(--critical)";
  const Icon = ok ? ShieldCheck : ShieldX;
  return (
    <div className="flex items-center gap-4 rounded-[1.25rem] bg-card p-5 shadow-card">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          {ok ? "Audit log verified" : "Audit log TAMPERED"}
        </p>
        <p className="nums mt-0.5 text-xs text-muted-foreground">
          {ok
            ? `Hash chain intact across ${integrity.entries} entries (audit_verify)`
            : `Chain breaks at entry #${integrity.broken_at}`}
        </p>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof UserCheck;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.25rem] bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="nums ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [integrity, setIntegrity] = React.useState<IntegrityView | null>(null);
  const [audit, setAudit] = React.useState<AuditView[]>([]);
  const [approvals, setApprovals] = React.useState<ApprovalView[]>([]);
  const [overrides, setOverrides] = React.useState<OverrideView[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([getIntegrity(), getAudit(), getApprovals(), getOverrides()])
      .then(([i, a, ap, ov]) => {
        setIntegrity(i);
        setAudit(a);
        setApprovals(ap);
        setOverrides(ov);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const navigate = (key: string) => router.push(key === "overview" ? "/" : "/admin");

  return (
    <AppShell active="settings" onNavigate={navigate}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin · Governance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every privileged action is append-only and hash-chained. Nothing happens unlogged.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[var(--critical)] bg-[color-mix(in_oklch,var(--critical)_8%,transparent)] p-4 text-sm text-[var(--critical)]">
            {error}
          </div>
        )}

        <IntegrityBadge integrity={integrity} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Pending approvals" icon={UserCheck} count={approvals.length}>
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts awaiting approval.</p>
            ) : (
              approvals.map((a) => (
                <div
                  key={a.request_id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.email} · requests {a.role_requested}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground opacity-70">
                    Approve
                  </span>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Override-watch" icon={GitPullRequestArrow} count={overrides.length}>
            {overrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">No engine overrides recorded.</p>
            ) : (
              overrides.map((o) => (
                <div key={`${o.team_id}-${o.at}`} className="rounded-xl border border-border p-3">
                  <p className="nums text-sm font-medium text-foreground">
                    {o.team_id}: {o.from_status} → {o.to_status}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.lecturer} — “{o.reason}”
                  </p>
                </div>
              ))
            )}
          </Panel>
        </div>

        <Panel title="Audit stream" icon={ScrollText} count={audit.length}>
          <div className="flex flex-col gap-1.5">
            {audit.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="nums w-6 shrink-0 text-muted-foreground">#{e.id}</span>
                <span className="font-medium text-foreground">{e.action}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {e.actor_role} · {e.target_id ?? "—"}
                  {e.reason ? ` · “${e.reason}”` : ""}
                </span>
                <span className="nums ml-auto shrink-0 text-[0.625rem] text-muted-foreground">
                  {e.row_hash?.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
