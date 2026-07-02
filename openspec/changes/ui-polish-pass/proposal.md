## Why

Product-owner review (2026-07-02, Vietnamese feedback) flagged five recurring visual
rough edges across the FE mock: boxes read too square ("mấy cái ô cảm giác vuông quá,
cho nó bo tí"), obviously-fake placeholder names leak into visible mock data ("Nguyễn
Văn A là tên gì" / "tên này không cần thiết"), person cards put the name below the
avatar when the reference puts it slightly above ("cái tên nó ở trên Avatar 1 tí"),
ring/percentage progress reads less clearly than a labelled bar ("cái progress đổi
thành thanh status cho trực quan"), and the home landing should hug the StarCi
reference section layout ("ráng ăn theo bố cục của nó"). These are cross-cutting
polish items, not new features — best done as one token/blocks-level pass so the fixes
land once rather than per-component.

## What Changes

- **Softer corners globally**: bump the shared radius one notch at the token layer
  (`--radius`, `--field-radius` in `globals.css` + HeroUI theme) and the shared card
  block so surfaces (`rounded-3xl` cards, `rounded-large` panels) read rounder — one
  change, not per-component. Pills/avatars stay `rounded-full`; inputs/chips stay
  sensible (do not over-round small controls).
- **Remove placeholder person names**: scan visible mock data and replace obviously-fake
  names ("Nguyễn Văn A", "Nguyễn Văn X", "Nguyen Van A", "Người dùng A") with realistic
  Vietnamese names, or omit the name where it carries no meaning. Covers profile,
  community/comments, members, leaderboard, search, chat, recommendation, subject.
- **Name-above-avatar on identity cards**: on mentor / honor ("bảng vàng") / achiever
  profile cards, order the NAME above the avatar (name on top, avatar below/overlapping)
  per the reference, via a shared identity-block variant, with responsive layout and
  heading semantics preserved.
- **Progress ring/percent → horizontal status bar**: replace bare ring/percentage
  progress readouts with a labelled horizontal status bar (state label + %) on course
  progress, profile progress, subject overview, and skill/career mastery. Reuse the
  existing `ProgressMeter` block; keep it FE mock.
- **Home landing follows the reference layout**: a short cross-cutting note that the
  landing section order/bottom-line hugs the StarCi reference, cross-referencing the
  in-flight `home-landing-redesign` change (not edited here).

## Capabilities

### New Capabilities
- `ui-polish`: cross-cutting FE visual-polish contract — global corner-radius token
  bump, placeholder-name hygiene in visible mock data, name-above-avatar identity-card
  layout, progress-ring-to-status-bar swap, and the home-landing reference-layout note.

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers these visual conventions; this
  is a new cross-cutting polish capability)

## Impact

- **Design tokens**: `src/app/globals.css` (`--radius`, `--field-radius`), HeroUI theme
  radius; shared card/panel blocks (`blocks/cards/*`, `blocks/cards/PressableCard`).
- **Identity blocks**: `blocks/identity/UserCell` (name-above-avatar variant) consumed
  by mentor/achiever cards.
- **Progress**: `features/course/CourseProgress`, `features/profile/ProfileProgress`,
  `features/subject/SubjectOverview`, `features/career/*`; reuses
  `blocks/stats/ProgressMeter`.
- **Mock data**: SWR hooks under `features/*/hooks/*` and `src/messages/{vi,en}.json`
  carrying placeholder names.
- **Cross-reference only**: `openspec/changes/home-landing-redesign` (not modified).
- FE-only mock; no backend, API, or dependency changes. Global radius bump has repo-wide
  visual reach — see design.md risk note.
