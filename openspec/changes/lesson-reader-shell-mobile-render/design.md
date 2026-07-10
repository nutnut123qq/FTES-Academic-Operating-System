## Context

FTES's learn shell is a *simplified* StarCI port: it has no `LearnSidebar`, no redux
`sidebar.mobileView` / `content.id` slices, and no `useSidebarNavItems` — its rails are just
`ContentMap` (left) and `OnThisPage` (right), slotted by `learn/layout.tsx` per route and
`hidden lg:flex`. So the starci `LearnMobileTabBar` (redux-driven, infra-heavy) cannot be
ported wholesale; the FTES-appropriate solution mirrors the lighter starci `LearnMobileBar`
(HeroUI `Drawer` + local state), adapted to FTES's two rails.

## Goals / Non-Goals

**Goals:** reach both rails on mobile; make migrated HTML lessons and code blocks read well;
a one-tap resume; drop the dead challenges tab; fix the header gap.

**Non-Goals:** porting starci's redux sidebar/tab-bar infra; a `LearnSidebar` course-nav rail
(FTES has none); filling the right rail with a `ContentActions` toolkit (deferred); video
playback-rate / resume-position (deferred); wiring real `hasChallenge`/duration (BE-blocked).

## Decisions

- **Mobile bar = FTES-native `LearnMobileBar`, not the starci port.** A new
  `LearnShell/LearnMobileBar/index.tsx`: a fixed `bottom-0 z-40 h-16 lg:hidden` bar with two
  HeroUI `Drawer` triggers — "content-map" (left drawer → `<ContentMap />`, on `content` /
  `modules` routes) and "on this page" (right drawer → `<OnThisPage mobile />`, on the lesson
  reader only). It computes `useSelectedLayoutSegments()` itself and returns `null` off content
  routes, so `LearnShell` can always render it. `ContentMap` already renders standalone
  (className-only) so it drops straight into a drawer; the same HeroUI `Drawer` API the AI FAB
  already uses. Rejected: a new redux slice + `LearnMobileTabBar` port (needs `LearnSidebar`,
  `useSidebarNavItems`, `content` slice FTES lacks — large, off-architecture).
- **`LearnShell` wiring.** Render `<LearnMobileBar />` inside the content column and add
  `max-lg:pb-16` (only when `!fullBleed`) so fixed chrome never covers the tail.
- **`OnThisPage` `mobile` prop.** Extract the rail body once; when `mobile`, wrap it in a plain
  full-width `div` (drop the `hidden w-64 lg:sticky lg:block` aside chrome) for the drawer;
  desktop keeps the `<aside>` path. `if (!contentId) return null` still applies.
- **HTML typography ladder.** Extend the `LessonDocumentHtml` container's descendant utilities
  (`[&_h2]/[&_h3]/[&_h4]/[&_code]/[&_pre]/[&_blockquote]/[&_img]/[&_table]`) to mirror the
  markdown reading typography, keeping DOMPurify sanitization unchanged.
- **Code scroll.** In `CodeToHtml`, drop `whitespace-pre-wrap`/`break-words` in favor of
  `whitespace-pre` + `overflow-x-auto` on the code container (highlighted div and raw `<pre>`
  fallback). Shared block → the standard scroll behavior improves every consumer.
- **Continue action.** In `ContentMap`, add a "continue" button in the pinned header linking to
  `header.continueLessonId` (reuse existing `content.continue` copy); hidden when null.
- **Dynamic challenges tab.** Build the reader `leftTabs.items` array conditionally, omitting
  the challenges entry when `!lesson.hasChallenge`. `hasChallenge` is BE-stubbed `false`, so the
  tab hides for now (correct — it is a dead-end) and reappears when the BE wires the flag.

## Risks / Trade-offs

- **`CodeToHtml` is app-wide** → horizontal scroll is the standard/correct behavior (GitHub,
  docs); wrapping that shatters tokens is worse. Verified by full `tsc` + webpack build.
- **HeroUI `Drawer` z-order** (memory: backdrop bakes `z-50`) → the mobile bar opens drawers at
  body level (NOT from inside a popover), so the known popover-on-popover z-fight does not apply.
- **Dynamic tab hides Challenges everywhere** while `hasChallenge` is stubbed → intended per the
  audit (dead-end removal); the on-this-page "practice" button remains the challenge entry.

## Migration Plan

Pure FE, no data migration, no flag. Verify: `tsc --noEmit` clean + `npm run build` green.
