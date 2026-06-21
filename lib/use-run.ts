"use client";

import * as React from "react";
import { type RunResponse, runPipeline } from "@/lib/api";
import { makeLookups } from "@/lib/format";
import { sampleRun } from "@/lib/sample-run";

export type RunStatus = "idle" | "running" | "done";

/** Shared allocation-run state machine used by every dashboard page.
 *  Live API first; falls back to the bundled sample (clearly flagged) when the
 *  service is unreachable. Pass autoRun to fetch on mount (Teams/Alerts/Pipeline). */
export function useRun(autoRun = false) {
  const [status, setStatus] = React.useState<RunStatus>("idle");
  const [stage, setStage] = React.useState(1);
  const [data, setData] = React.useState<RunResponse | null>(null);
  const [sample, setSample] = React.useState(false);

  const run = React.useCallback(async () => {
    setStatus("running");
    setStage(1);
    const ticker = setInterval(() => setStage((s) => Math.min(s + 1, 5)), 450);
    try {
      const result = await runPipeline();
      setSample(false);
      setData(result);
    } catch {
      setSample(true);
      setData(sampleRun);
    } finally {
      clearInterval(ticker);
      setStage(5);
      setStatus("done");
    }
  }, []);

  React.useEffect(() => {
    if (autoRun) void run();
  }, [autoRun, run]);

  const lookups = React.useMemo(
    () => (data ? makeLookups(data.student_profiles, data.teams) : null),
    [data],
  );

  return { status, stage, data, sample, run, lookups };
}
