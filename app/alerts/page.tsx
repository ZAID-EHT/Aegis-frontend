"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Info, Loader2, ShieldAlert, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/aegis/app-shell";
import { Card } from "@/components/ui/card";
import { AlertRow, SampleBadge, StatTile, rise, stagger } from "@/components/dashboard";
import { routeFor } from "@/lib/nav";
import { useRun } from "@/lib/use-run";

export default function AlertsPage() {
  const router = useRouter();
  const { data, sample, lookups } = useRun(true);
  const by = (s: string) => data?.alerts.filter((a) => a.severity === s).length ?? 0;

  return (
    <AppShell active="alerts" onNavigate={(key) => router.push(routeFor(key))}>
      <div className="flex flex-col gap-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Alerts</h1>
            {sample && <SampleBadge />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything that needs a closer look, most urgent first.
          </p>
        </div>

        {!data || !lookups ? (
          <Card className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking the cohort…
          </Card>
        ) : (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-3 gap-4"
            >
              <motion.div variants={rise}>
                <StatTile icon={ShieldAlert} label="Urgent" value={by("CRITICAL")} />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile icon={TriangleAlert} label="Attention" value={by("WARNING")} />
              </motion.div>
              <motion.div variants={rise}>
                <StatTile icon={Info} label="Info" value={by("INFO")} />
              </motion.div>
            </motion.div>

            {data.alerts.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                All clear — nothing needs your attention right now.
              </Card>
            ) : (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
              >
                {data.alerts.map((a, i) => (
                  <AlertRow key={`${a.trigger_type}-${i}`} alert={a} lookups={lookups} />
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
