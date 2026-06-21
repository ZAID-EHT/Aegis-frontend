/** Sidebar nav key -> route. Single source so every page navigates consistently. */
export const ROUTES: Record<string, string> = {
  overview: "/dashboard",
  teams: "/teams",
  alerts: "/alerts",
  pipeline: "/pipeline",
  settings: "/admin", // "Governance" in the sidebar
};

export const routeFor = (key: string): string => ROUTES[key] ?? "/dashboard";
