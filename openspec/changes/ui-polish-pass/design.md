## Context

FE-only Next.js mock (HeroUI v3, Tailwind tokens, i18n vi/en). The design system already
centralises radius and progress: `src/app/globals.css` defines `--radius: 0.5rem` and
`--field-radius: 0.75rem`; the house radius convention (`.claude/ui/CONTENT.md`,
`.claude/decision/card.md`) is form/modal `rounded-3xl`, content card `rounded-xl`/`rounded-large`,
chip/pill `rounded-full`, concentric child < parent. Cards default to `card--default`
(`bg-surface rounded-3xl`, no shadow). Progress is mostly the shared `blocks/stats/ProgressMeter`
(a labelled `ProgressBar`), but a few surfaces hand-roll a bar or a bare `%` readout. There is
NO HeroUI `CircularProgress` in the tree — "progress ring" here means bare-percent / thin
ad-hoc bars, so the swap is a consistency + labelling pass, not a ring rewrite.

## Goals / Non-Goals

- **Goals**: one-notch-rounder surfaces via tokens/blocks; zero obviously-fake placeholder
  names in visible mock; name-above-avatar identity cards; labelled horizontal status bars
  everywhere progress shows; a note anchoring the landing to the StarCi reference layout.
- **Non-Goals**: no backend/API/dependency change; not editing `home-landing-redesign` (only
  cross-referenced); not re-rounding pills/avatars/inputs; not building a real circular-ring
  component; no new mock personas beyond name substitution.

## Decisions

### 1. Radius bump — token/blocks, not per-component
Raise the shared scale one notch at the token layer so it propagates: `--radius: 0.5rem → 0.75rem`
and `--field-radius: 0.75rem → 1rem` in `globals.css`, mirrored in the HeroUI theme radius so
HeroUI-owned surfaces track. Where the card/panel blocks hard-code `rounded-3xl` / `rounded-large`,
bump to the next step (`rounded-3xl` stays the ceiling; `rounded-large`/`rounded-xl` → one notch up)
in the SHARED block only (`blocks/cards/*`, `PressableCard`, `SurfaceListCard`, `LabeledCard`).
Explicitly hold `rounded-full` (pills/avatars — `globals.css` lines ~144/150) and keep small
inputs/chips at their current sensible radius; over-rounded inputs look like pills.
- **Touch-points**: `src/app/globals.css` (`--radius`, `--field-radius`, HeroUI theme);
  `blocks/cards/{PressableCard,LabeledCard,SurfaceListCard,ContinueCard,CourseCard}`.
- **Why token-first over per-component**: matches the house rule "components don't hand-roll frame
  radius"; one diff, uniform result, easy to revert.

### 2. Placeholder-name scan + replace
Grep targets (verified present): `"Văn A"`, `"Nguyễn Văn"`, `"Nguyen Van"`, `"Người dùng A"`,
`"Nguyễn Văn X"`. Confirmed visible hits:
- `messages/vi.json` L65 `namePlaceholder: "Nguyễn Văn A"` (form placeholder — replace with a neutral
  realistic sample, or drop to a generic "Họ và tên"); `en.json` mirror.
- SWR mock hooks: `subject/useQuerySubjectSwr.ts` (`lecturer`), `subject/useQuerySubjectsSwr.ts`,
  `subject/useQuerySubjectMembersSwr.ts`, `gamification/useQueryLeaderboardSwr.ts`,
  `search/useQuerySearchSwr.ts`, `course/useQueryCourseDetailSwr.ts`, `chat/useQueryConversationsSwr.ts`,
  `recommendation/useQueryRecommendationsSwr.ts`, `group/useQueryGroupManageSwr.ts` (`"Nguyễn Văn X"`).
- **Keep**: real credited name `"Nguyễn Văn Tự Cường"` (madeBy / team) and `"Nguyễn Văn Học"`
  (profile persona) are legitimate — do NOT strip. Replace only the A/X placeholder pattern.
- **Replace with**: realistic Vietnamese full names (e.g. Trần Minh Quân, Lê Thu Hà, Phạm Gia Bảo…),
  keeping `avatarInitials`/handles in sync; omit the name only where it is purely decorative.

### 3. Name-above-avatar identity card
Add a `nameAbove` (name-on-top) ordering variant to the shared identity block
`blocks/identity/UserCell` (avatar + name pair), so mentor / "bảng vàng" achiever / profile
person cards render NAME (heading) → AVATAR below, optionally overlapping. Consumers:
home-landing mentor/achiever cards and profile person cards.
- **A11y**: name stays a real heading element (`h3`/`h4` per context), avatar keeps `alt`/initials;
  reading order = name→avatar matches DOM order (no CSS `order` reversal that desyncs SR output).
- **Responsive**: center-stacked; avatar size steps down on mobile; name wraps, never truncates the
  heading. Reference: the home-landing mentor/achiever card layout.

### 4. Progress ring/percent → status bar
Standardise on `blocks/stats/ProgressMeter` (labelled horizontal `ProgressBar` with state label + %).
Swap the hand-rolled/bare-percent surfaces:
- `features/course/CourseProgress` (L35-42: hand-rolled `<div>` bar + separate `%`) → `ProgressMeter`
  with a status label ("Đang học 62%").
- `features/profile/ProfileProgress` (stat readout) → add a `ProgressMeter` where a completion % shows.
- `features/subject/SubjectOverview` + `subject` mastery / `features/career` skill mastery `%` →
  `ProgressMeter` with a labelled state.
- **Status label** = short state text ("Chưa bắt đầu / Đang học / Hoàn thành") + `%`, so the bar reads
  without a legend. Keep FE mock values from existing hooks.

### 5. Home-landing reference note
A single requirement stating the landing's section order/bottom-line follows the StarCi reference
layout, cross-referencing `openspec/changes/home-landing-redesign` as the owning change. This change
does NOT edit that change's files — it only records the expectation so both stay aligned.

## Risks / Trade-offs

- **Global radius bump has repo-wide visual reach** — every card/panel shifts at once. Mitigation:
  bump at the token/shared-block layer only, hold `rounded-full` and small inputs, review a few dense
  surfaces (tables, chips, nested concentric cards) so child radius never exceeds parent.
- **Name replacement can desync derived fields** (`avatarInitials`, `@handle`, `subtitle`). Mitigation:
  update initials/handles alongside each name; keep i18n vi/en parity.
- **Progress swap on surfaces that intentionally show a compact number** — keep the number inside the
  bar's label, don't remove the figure.

## Migration / Verification

No data migration. Verify with `npx tsc --noEmit`; the full webpack build is orchestrator-verified
(noted in tasks). FE-only; all values remain mock.

## Assumptions

- HeroUI theme radius is configurable alongside the CSS vars (no HeroUI upgrade needed).
- "Progress ring" in the feedback maps to the bare-percent / ad-hoc-bar surfaces above (no true SVG
  ring component exists to replace).
- `home-landing-redesign` remains the sole owner of landing section content; this change only notes
  the reference-layout expectation.
