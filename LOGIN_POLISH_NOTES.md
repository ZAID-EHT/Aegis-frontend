# LOGIN_POLISH_NOTES.md

## What changed

- Installed the requested Three.js package group with pnpm: `three`, `@react-three/fiber`, `@react-three/drei`, and `@types/three`.
- Kept `framer-motion` and `lucide-react`; both were already present.
- Fixed the navbar hover link clipping so duplicate labels no longer show at once.
- Improved the dot-field center fade so the sign-in form stays readable.
- Raised contrast on the Google button, email field, and password field.
- Added the real multi-color Google mark.
- Added elevated floating data cards with stronger shadow, clearer semantic color, and light/dark variants.
- Added Features, How it works, FAQ, and Footer sections below the hero.
- Replaced the root route with the same polished AEGIS login/landing surface.
- Added `/privacy`, `/terms`, and `/cookies` pages.
- Added scroll-aware navbar blur and global smooth scrolling.

## Visual decisions to eyeball

- Dot density and motion speed on large displays.
- The amount of center fade behind the form in both themes.
- Floating card placement on tablet-width screens.
- The root page now uses the login/landing surface instead of the older separate marketing page.
- The footer is intentionally restrained and dense; check that it has enough presence for the demo.

## Constraints hit

- `pnpm exec tsc --noEmit` could not find `tsc` in this Windows shell, so verification used `pnpm run typecheck`, which runs `tsc --noEmit`.
- I did not touch the existing auth callback route during this polish task, per the hard rule.
- Browser checks were route-level probes from the dev server, not visual screenshots.

## Verification

- `pnpm run typecheck`: passed.
- `/`: 200.
- `/login`: 200.
- `/privacy`: 200.
- `/terms`: 200.
- `/cookies`: 200.
