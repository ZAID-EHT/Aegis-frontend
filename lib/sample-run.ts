/** Clean, editable sample dataset for the dashboard — used as a fallback when the
 *  live service isn't running, so demos work offline. Names are from the uploaded
 *  mock set (synthetic). Shape matches the live API exactly (RunResponse), so the
 *  UI renders it identically. Edit values here freely.
 */

import type { RunResponse } from "@/lib/api";

export const sampleRun: RunResponse = {
  stages: [],
  teams: [
    {
      team_id: "T_A",
      project_id: "P_A",
      project_title: "Campus Wellbeing App",
      health_score: 84,
      band: "healthy",
      components: {},
      unallocated_hours: 0,
      members: [
        { student_id: "S1", name: "Nadeesha Perera", utilisation: 0.78, overloaded: false },
        { student_id: "S2", name: "Hashan Rathnayake", utilisation: 0.82, overloaded: false },
        { student_id: "S3", name: "Senuri Bandara", utilisation: 0.74, overloaded: false },
        { student_id: "S4", name: "Sandun Liyanage", utilisation: 0.7, overloaded: false },
      ],
    },
    {
      team_id: "T_B",
      project_id: "P_B",
      project_title: "Smart Energy Tracker",
      health_score: 68,
      band: "at_risk",
      components: {},
      unallocated_hours: 0,
      members: [
        { student_id: "S5", name: "Ruwan Abeysekara", utilisation: 0.88, overloaded: false },
        { student_id: "S6", name: "Sanjana Fernando", utilisation: 0.64, overloaded: false },
        { student_id: "S7", name: "Kasun Silva", utilisation: 0.8, overloaded: false },
        { student_id: "S8", name: "Vihanga Rathnayake", utilisation: 0.6, overloaded: false },
      ],
    },
    {
      team_id: "T_C",
      project_id: "P_C",
      project_title: "Community Relief Platform",
      health_score: 42,
      band: "critical",
      components: {},
      unallocated_hours: 5,
      members: [
        { student_id: "S9", name: "Sasini Weerasinghe", utilisation: 1.2, overloaded: true },
        { student_id: "S10", name: "Kasun Liyanage", utilisation: 1.2, overloaded: true },
        { student_id: "S11", name: "Tharusha Liyanage", utilisation: 1.2, overloaded: true },
        { student_id: "S12", name: "Gimhani Rathnayake", utilisation: 1.2, overloaded: true },
      ],
    },
  ],
  alerts: [
    {
      severity: "CRITICAL",
      trigger_type: "health_critical",
      detail: "",
      team_id: "T_C",
      student_id: null,
    },
    {
      severity: "CRITICAL",
      trigger_type: "ghosting_tier3",
      detail: "",
      team_id: "T_C",
      student_id: "S10",
    },
    {
      severity: "WARNING",
      trigger_type: "sympathy_carry",
      detail: "",
      team_id: "T_C",
      student_id: "S9",
    },
    { severity: "WARNING", trigger_type: "burnout", detail: "", team_id: "T_B", student_id: "S5" },
    {
      severity: "WARNING",
      trigger_type: "health_at_risk",
      detail: "",
      team_id: "T_B",
      student_id: null,
    },
  ],
  duplicate_flags: [{ project_a: "P_A", project_b: "P_C", similarity: 0.91 }],
  exception_pool: [],
  student_profiles: [
    {
      student_id: "S1",
      name: "Nadeesha Perera",
      team_id: "T_A",
      project_id: "P_A",
      fit: 86,
      rationale: "",
      skills: [
        {
          discipline: "technical",
          declared: 5,
          confidence: 0.5,
          adjusted: 2.5,
          basis: "contradicted",
          corrected: true,
        },
        {
          discipline: "ux",
          declared: 4,
          confidence: 0.8,
          adjusted: 3.2,
          basis: "portfolio",
          corrected: false,
        },
        {
          discipline: "management",
          declared: 3,
          confidence: 0.6,
          adjusted: 1.8,
          basis: "self_report",
          corrected: false,
        },
        {
          discipline: "communication",
          declared: 4,
          confidence: 1,
          adjusted: 4,
          basis: "verified",
          corrected: false,
        },
      ],
    },
    { student_id: "S5", name: "Ruwan Abeysekara", team_id: "T_B", project_id: "P_B", fit: 80, rationale: "", skills: [] },
    { student_id: "S9", name: "Sasini Weerasinghe", team_id: "T_C", project_id: "P_C", fit: 71, rationale: "", skills: [] },
    { student_id: "S10", name: "Kasun Liyanage", team_id: "T_C", project_id: "P_C", fit: 69, rationale: "", skills: [] },
  ],
};
