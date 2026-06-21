"use client";

/**
 * PipelineStepper — AEGIS's signature element.
 * Renders the engine as a sequence: Verify → Dedupe → Match → Form → Monitor.
 * Order carries real meaning here (each stage trusts the previous one's output),
 * so the stepped/numbered treatment is earned, not decorative.
 *
 * <PipelineStepper current={2} />            // running, on "Match"
 * <PipelineStepper current={5} done />       // finished
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Stage {
  key: string;
  label: string;
  hint?: string;
}

const DEFAULT_STAGES: Stage[] = [
  { key: "check", label: "Check details" },
  { key: "dedupe", label: "Remove duplicates" },
  { key: "match", label: "Match preferences" },
  { key: "form", label: "Form teams" },
  { key: "review", label: "Review alerts" },
];

export interface PipelineStepperProps {
  stages?: Stage[];
  current: number;       // 1-based index of the active stage
  done?: boolean;        // all stages complete
  className?: string;
}

export function PipelineStepper({
  stages = DEFAULT_STAGES,
  current,
  done = false,
  className,
}: PipelineStepperProps) {
  const reduce = useReducedMotion();
  const total = stages.length;
  const activeIndex = done ? total : Math.max(1, Math.min(total, current));
  const progress = (Math.max(0, activeIndex - 1) / (total - 1)) * 100;

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-border/60 bg-card p-6 shadow-card",
        className,
      )}
    >
      <div className="relative mx-auto flex max-w-3xl items-start justify-between">
        {/* track */}
        <div className="absolute left-0 right-0 top-4 mx-5 h-0.5 rounded-full bg-border" />
        <motion.div
          className="absolute left-0 top-4 mx-5 h-0.5 rounded-full bg-primary"
          style={{ maxWidth: "calc(100% - 2.5rem)" }}
          initial={{ width: reduce ? `${progress}%` : 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduce ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] }}
        />

        {stages.map((stage, i) => {
          const idx = i + 1;
          const state =
            idx < activeIndex ? "done" : idx === activeIndex && !done ? "active" : done ? "done" : "todo";
          return (
            <div key={stage.key} className="relative z-10 flex w-full flex-col items-center gap-2">
              <motion.div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary bg-card text-primary",
                  state === "todo" && "border-border bg-card text-muted-foreground",
                )}
                initial={false}
                animate={
                  state === "active" && !reduce
                    ? {
                        boxShadow: [
                          "0 0 0 0px color-mix(in oklch, var(--primary) 30%, transparent)",
                          "0 0 0 8px color-mix(in oklch, var(--primary) 0%, transparent)",
                        ],
                      }
                    : { boxShadow: "0 0 0 0px transparent" }
                }
                transition={
                  state === "active" && !reduce
                    ? { duration: 1.5, repeat: Infinity, ease: "easeOut" }
                    : { duration: 0.3 }
                }
              >
                {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : idx}
              </motion.div>
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "text-xs font-medium",
                    state === "todo" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {stage.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
