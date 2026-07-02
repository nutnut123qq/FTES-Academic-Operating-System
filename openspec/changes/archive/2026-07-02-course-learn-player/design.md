## Context
Course learn flow: after enroll, the learner works through lessons. The player is
where they spend time. Layout approved with the teacher (2026-07-02) from the mockup.

## Goals / Non-Goals
**Goals:** curriculum rail + content area, completion + progress, mark-complete,
prev/next, end-of-chapter challenge entry, build green, FE mock.
**Non-Goals:** real video, persisted completion, notes storage, real challenge grading.

## Decisions
- **Archetype:** course-learn two-column — top progress bar + `lg:grid-cols-[320px_1fr]`;
  left rail `lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]` (its own scroll), right content scrolls.
- **Rail = the shared `OutlineRail` block** — it already does progress header + client
  search + accordion of `ContentMapRow`s with read/active/lock/premium markers. The
  feature maps outline → groups/items and owns the controlled state (search, expanded,
  session mark-complete overlay).
- **Content tabs = `ExtendedTabs`** (underline/secondary variant): Bài giảng (overview),
  Tài liệu (docs), Ghi chú (notes placeholder). Panels switched by local `selectedKey`.
- **Mark-complete = session overlay Set** (ponytail) — a real BE persists per user.
- **Challenge callout = accent-tint banner** at the end of the content, CTA into the quiz.
- Premium lessons show a lock in the rail — unlock by enrolling (premium-unlock-is-enroll).

## Risks / Trade-offs
- Mock data; video placeholder; mark-complete not persisted — logged with ponytail markers.
- Completion overlay resets on navigation (session-only) — acceptable for the FE mock.
