## Why

The Community page's sticky tab header currently uses an opaque `bg-background` fill. Because the ambient meteor effect (`AmbientBackground`) is fixed behind all content and distributed evenly across the viewport, the opaque header becomes the only rectangular region where meteors never appear. Even though the color matches the page background exactly, the absence of meteors inside the header makes it read as a solid block, breaking the calm, edge-to-edge atmospheric effect the page is meant to have.

## What Changes

- In `src/components/features/community/CommunityShell/index.tsx`, remove `bg-background` from the sticky header div and add `backdrop-blur` (pure blur, no fill color, no border).
- Update the inline comment above the header to describe the new transparent + blur behavior.
- Keep every other class and all child JSX unchanged (`sticky top-16 z-10`, `relative`, `flex items-center justify-center`, `px-4 pt-3`, centered tabs, absolute `⋯` menu on the right).

## Capabilities

### New Capabilities

_None — this is a pure presentation/UX tweak in an existing component._

### Modified Capabilities

_None — no spec-level behavior or API contract changes._

## Impact

- Affects only the `CommunityShell` header styling.
- No API, i18n, routing, tab logic, or child component changes.
- Dark and light modes both remain supported via Tailwind semantic tokens; no hardcoded colors are introduced.
