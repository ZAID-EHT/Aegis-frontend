"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface SessionUser {
  email: string;
  name: string;
  role: string;
}

function toUser(u: User): SessionUser {
  const meta = u.user_metadata ?? {};
  return {
    email: u.email ?? "",
    name: (meta.full_name as string) || (u.email?.split("@")[0] ?? "Account"),
    role: (meta.role as string) || "Member",
  };
}

/** Current Supabase auth user + a sign-out action, kept live via auth state changes. */
export function useUser() {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ? toUser(data.user) : null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUser(session.user) : null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, [supabase]);

  return { user, loading, signOut };
}
