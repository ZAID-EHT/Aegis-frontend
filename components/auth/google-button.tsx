"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** Google OAuth sign-in via Supabase. Redirects to the provider, then back through
 *  /auth/callback which exchanges the code for a session. */
export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    // 0.0.0.0 (dev LAN bind) isn't browsable — send OAuth back to localhost instead.
    const origin = window.location.origin.replace("0.0.0.0", "localhost");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // on success the browser is redirected to Google, so no further handling here.
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-card transition-all hover:shadow-card-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {label}
      </button>
      {error && (
        <p className="text-xs" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/** "or" divider between OAuth and the email form. */
export function OrDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border/70" />
      <span className="text-xs font-medium text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border/70" />
    </div>
  );
}
