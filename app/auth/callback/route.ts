import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Exchanges the email-confirmation / OAuth code for a session, then redirects. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  // The dev server may bind 0.0.0.0 (LAN sharing); 0.0.0.0 is not a browsable host.
  // Prefer the browser-sent Host header and never redirect the browser to 0.0.0.0.
  const host = (request.headers.get("host") ?? url.host).replace(/^0\.0\.0\.0(:|$)/, "localhost$1");
  const base = `${url.protocol}//${host}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${next}`);
  }
  return NextResponse.redirect(`${base}/login?error=link`);
}
