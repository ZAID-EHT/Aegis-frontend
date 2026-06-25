"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/** A ~2s startup splash: the AEGIS mark scales in over a drifting aurora, then the
 *  whole overlay fades out to reveal the page. Plays once per session (sessionStorage),
 *  is skippable (click/tap), and is skipped entirely under prefers-reduced-motion.
 *  Renders nothing on the server, so there's no hydration mismatch. */
export function IntroSplash() {
  const reduce = useReducedMotion();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (reduce) return; // honor reduced motion — no splash
    try {
      if (sessionStorage.getItem("aegis_intro_seen")) return;
      sessionStorage.setItem("aegis_intro_seen", "1");
    } catch {
      /* sessionStorage unavailable — still show once this mount */
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          onClick={() => setShow(false)}
          role="presentation"
        >
          {/* aurora behind the mark */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div
              className="animate-aurora absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 30%, transparent), transparent)",
              }}
            />
          </div>
          <motion.div
            initial={{ scale: 0.82, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 1.0, ease: EASE }}
            className="relative"
          >
            <Image
              src="/aegis-logo.png"
              alt="AEGIS — capstone allocation"
              width={160}
              height={160}
              priority
              className="h-28 w-28 object-contain sm:h-36 sm:w-36 dark:rounded-3xl dark:bg-white dark:p-4 dark:ring-1 dark:ring-black/5"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
