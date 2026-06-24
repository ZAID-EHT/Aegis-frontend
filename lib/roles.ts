/** Role helpers — single source for who-can-see-what in the UI.
 *
 * NOTE: this is presentation-layer gating only (the demo's chosen scope). The
 * authoritative control for /admin/* is the backend require_admin dependency;
 * /run is not yet role-filtered server-side, so a student calling the API
 * directly could still read all teams. Treat this as UX, not a security boundary.
 */

export type Role = "student" | "lecturer" | "admin" | string;

export const isAdmin = (role?: string | null): boolean => role === "admin";
export const isStaff = (role?: string | null): boolean =>
  role === "lecturer" || role === "admin";
export const isStudent = (role?: string | null): boolean => !isStaff(role);

/** Sidebar nav keys this role may see, in display order. */
export function navKeysFor(role?: string | null): string[] {
  if (isAdmin(role))
    return ["overview", "teams", "alerts", "pipeline", "settings", "account"];
  if (isStaff(role)) return ["overview", "teams", "alerts", "pipeline", "account"]; // lecturer: no Governance
  return ["overview", "profile", "account"]; // student: workspace + own profile + settings
}

/** Whether a role may open a given nav key directly (for route guards). */
export const canAccess = (role: string | null | undefined, key: string): boolean =>
  navKeysFor(role).includes(key);
