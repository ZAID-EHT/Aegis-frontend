import Image from "next/image";
import { cn } from "@/lib/utils";

/** AEGIS brand lockup — transparent emblem + optional wordmark.
 *
 *  The emblem (`/aegis-logo.png`) is navy + gold on a transparent background. It's
 *  shown bare on light surfaces; in dark mode it sits on a small light chip so the
 *  navy can never disappear into a dark background. Responsive sizing; sharp (the
 *  source is 1200px, rendered small). When the wordmark text is shown the image is
 *  decorative (alt=""), so screen readers don't read "AEGIS" twice. */
export function Logo({
  wordmark = true,
  className,
}: {
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 dark:bg-white dark:ring-1 dark:ring-black/5">
        <Image
          src="/aegis-logo.png"
          alt={wordmark ? "" : "AEGIS — capstone allocation"}
          width={36}
          height={36}
          priority
          className="h-7 w-7 object-contain sm:h-8 sm:w-8"
        />
      </span>
      {wordmark && (
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          AEGIS
        </span>
      )}
    </div>
  );
}
