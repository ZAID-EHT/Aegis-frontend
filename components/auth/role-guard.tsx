"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/components/auth/user-provider";
import { canAccess } from "@/lib/roles";

/**
 * Client route guard. Returns true once it's confirmed the current user may see
 * `navKey`; otherwise redirects to /dashboard and returns false. Waits for the
 * session to finish loading so a staff user isn't bounced mid-load.
 *
 * Presentation-layer only (matches the demo's chosen scope) — the API is the
 * real authority for /admin/*.
 */
export function useAccessGuard(navKey: string): boolean {
  const { user, loading } = useUser();
  const router = useRouter();
  const ok = canAccess(user?.role, navKey);

  React.useEffect(() => {
    if (!loading && !ok) router.replace("/dashboard");
  }, [loading, ok, router]);

  return !loading && ok;
}
