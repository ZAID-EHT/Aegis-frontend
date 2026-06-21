/** Single source of all human-facing copy. Edit wording here, not inside components.
 *  No formulas, codes, or IDs leak to the UI from this file. */

import type { AlertView } from "@/lib/api";
import { type Tone, makeLookups, severityTone } from "@/lib/format";

type Lookups = ReturnType<typeof makeLookups>;

/** Allocation pipeline steps — plain language, no formulas. */
export const PIPELINE_STEPS = [
  { key: "check", label: "Check details" },
  { key: "dedupe", label: "Remove duplicates" },
  { key: "match", label: "Match preferences" },
  { key: "form", label: "Form teams" },
  { key: "review", label: "Review alerts" },
];

/** Team health band → friendly label + tone. */
const BAND: Record<string, { label: string; tone: Tone }> = {
  healthy: { label: "On track", tone: "healthy" },
  at_risk: { label: "Needs attention", tone: "at_risk" },
  critical: { label: "Needs urgent care", tone: "critical" },
};
export const band = (b: string) => BAND[b] ?? BAND.at_risk;

/** Severity → short status word. */
export const severityLabel: Record<string, string> = {
  CRITICAL: "Urgent",
  WARNING: "Attention",
  INFO: "Info",
};

/** Summary tiles. */
export const SUMMARY = {
  teams: "Teams formed",
  onTrack: "On track",
  attention: "Needs attention",
  alerts: "To review",
};

/** Short recommendation lines shown on cards. */
export const RECOMMENDATION = {
  overload: "Workload needs balancing",
};

/** Plain-language alert copy keyed by engine trigger. */
const ALERT_COPY: Record<string, { title: string; description: string }> = {
  ghosting_tier3: {
    title: "Member engagement is low",
    description: "A student has gone quiet — a check-in is recommended.",
  },
  ghosting_tier2: {
    title: "Engagement is slipping",
    description: "Activity has dropped off lately — worth a quick nudge.",
  },
  ghosting_tier1: {
    title: "Early signs of disengagement",
    description: "A little less active than usual.",
  },
  sympathy_carry: {
    title: "Workload is uneven",
    description: "One student is absorbing a teammate's share of the work.",
  },
  burnout: {
    title: "Possible burnout risk",
    description: "A student is doing far more than the rest of the team.",
  },
  health_critical: {
    title: "Team needs urgent attention",
    description: "Overall team health is low.",
  },
  health_at_risk: {
    title: "Team needs a closer look",
    description: "A few signals are trending the wrong way.",
  },
  duplicate_project: {
    title: "Similar proposals found",
    description: "Two project ideas look alike.",
  },
};

export interface FriendlyAlert {
  title: string;
  description: string;
  context: string; // a person and/or team name — never an ID
  tone: Tone;
  severity: string;
}

export function friendlyAlert(alert: AlertView, lookups: Lookups): FriendlyAlert {
  const copy = ALERT_COPY[alert.trigger_type] ?? {
    title: alert.trigger_type.replace(/_/g, " "),
    description: "",
  };
  const who = lookups.name(alert.student_id);
  const team = lookups.teamLabel(alert.team_id);
  return {
    title: copy.title,
    description: copy.description,
    context: [who, team].filter(Boolean).join(" · "),
    tone: severityTone(alert.severity),
    severity: severityLabel[alert.severity] ?? alert.severity,
  };
}
