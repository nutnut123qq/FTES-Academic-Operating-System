## Context

The Community page header in `src/components/features/community/CommunityShell/index.tsx` is a sticky tab strip (`sticky top-16 z-10`) that currently carries `bg-background`. The page has a full-viewport fixed `AmbientBackground` (meteor effect) behind all content. An opaque header therefore occludes meteors in its rectangle, creating a visible "no-meteor zone" even though its color matches the page.

Earlier iterations tried `bg-background/70` + `backdrop-blur`; that produced a frosted card with a visible edge and was rejected. This change takes the opposite direction: remove the fill entirely and rely on pure backdrop blur so meteors remain visible (slightly diffused) through the header.

## Goals / Non-Goals

**Goals:**
- Make meteors visually pass through the Community header so the header no longer reads as a solid rectangle.
- Keep the tabs sticky and centered while scrolling.
- Preserve the existing absolute `⋯` menu placement on the right below `xl`.
- Use only Tailwind semantic utilities; no hardcoded colors, no new background fill, no border.

**Non-Goals:**
- Changing feed post styling, rails, composer, or any other community component.
- Changing tab labels, routes, i18n, or selection logic.
- Adding any background tint, border, or shadow to the header.

## Decisions

- **Approach B: transparent + pure `backdrop-blur`.**
  - Rejected: opaque `bg-background` (creates the no-meteor rectangle).
  - Rejected: `bg-background/70 + backdrop-blur` (reads as a frosted card with an edge).
  - Chosen: remove `bg-background` and add only `backdrop-blur`. Meteors and scrolling content pass through and soften; tab text stays sharp on top. This matches the Threads-style "content floats under the nav" idiom while keeping the header edge-free.

## Risks / Trade-offs

- [Trade-off] Posts scrolling directly under the header will appear blurred. This is intentional (Threads-like behavior), but tab readability depends on blur strength. `backdrop-blur` (default intensity) is chosen as the standard Tailwind value; it is expected to provide enough separation without a tint.
- [Risk] In very low-contrast situations tab text could compete with background content. Mitigation: HeroUI `Tabs` already applies its own active-state underline and text styling; we are not changing that.
