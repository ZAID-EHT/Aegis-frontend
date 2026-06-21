"use client";

import { MotionConfig } from "framer-motion";

import { UserProvider } from "@/components/auth/user-provider";

/** App-wide providers: reduced-motion-aware motion config + a single auth-state
 *  source (fetched once, shared across the app instead of per page mount). */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <UserProvider>{children}</UserProvider>
    </MotionConfig>
  );
}
