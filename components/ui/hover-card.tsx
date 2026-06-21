"use client";

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "@/lib/utils";

/**
 * HoverCard — pointer-hover preview (Radix). Opens on hover after a short delay,
 * closes on leave; portalled so it can't be clipped, collision-aware, keyboard
 * accessible. Styled with the AEGIS premium tokens; the smooth open/close motion
 * lives in globals.css (.aegis-hovercard, reduced-motion safe).
 */
const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 10, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={16}
      className={cn(
        "aegis-hovercard z-50 w-80 rounded-2xl border border-border/60 bg-popover p-5 text-popover-foreground shadow-card-lg outline-none",
        className,
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };
