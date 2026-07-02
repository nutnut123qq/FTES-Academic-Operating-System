## Context

- Current: `SubjectAiTools/index.tsx` renders a static 5-card grid (tutor / summary /
  quiz / flashcards / ocr) from `useQuerySubjectAiToolsSwr`; CTAs are no-ops. The tab
  lives inside `SubjectWorkspaceShell` (sidebar rail + identity header + tab content).
- Prior art (reuse, don't reinvent): the learn-area `ContentAiChat` pattern documented in
  `.claude/rules/drafts/` — composer-in-box (flat input + [model picker · ⚙ · send]
  inside ONE bounded box, dropdown opens up), multi-session conversations
  (lazy-create on first send, auto-title from first question, recency list + search),
  in-panel secondary views (`view: "chat" | "conversations" | "settings"` — never a
  Drawer/Modal stacked over the panel), reset-thread only in switch/new handlers (never
  in an effect keyed on session id), destructive "delete conversation" per-row in the
  conversations view.
- Constraints: FE-only mock BE (CLAUDE.md); mock/placeholder + logged assumptions, never
  a fabricated live API. Gating axis = enrollment/membership, not "VIP".

## Goals / Non-Goals

**Goals:** functional AI hub in the tab; tutor chat with mock streaming; summary + quiz +
flashcard mock generation; membership gating; vi/en i18n; a11y; mobile in-panel UX;
SWR-shaped hooks ready for a drop-in BE swap; build + tsc green.

**Non-Goals:** real AI/LLM calls, sockets, credits/quota, OCR tool surface (stays
"coming soon"), selection-anchored ask (learn-area feature), cross-subject search,
server persistence (FE mock only, assumption logged).

## Decisions

1. **Tool surfaces render inside the tab via local view state, not sub-routes.**
   `SubjectAiTools` holds `activeTool: AiToolKey | null`. `null` → hub card grid;
   set → the tool surface replaces the grid (back button restores the hub).
   *Why:* keeps the change FE-local (no new `app/` routes for 3 tools), matches the
   in-panel-view house rule, and the workspace sidebar already owns URL-level nav.
   *Alternative:* `/subjects/[id]/ai/[tool]` sub-routes — deferred; easy to lift later
   since each tool is its own component.
2. **Component decomposition** (one folder per tool under `SubjectAiTools/`):
   - `SubjectAiTools/index.tsx` — hub grid + `activeTool` switch + gating wrapper.
   - `SubjectAiTutor/` — chat surface: thread, composer-in-box, in-panel
     `conversations` and `settings` views.
   - `SubjectAiSummary/` — source picker (subject resources/lessons) → summary output.
   - `SubjectAiQuiz/` — options → generated quiz (answer + FE grading).
   - `SubjectAiFlashcards/` — options → flip-card deck.
   Features own data + handlers; blocks/HeroUI own styling (house canon). New code at
   apply time goes through `starci-fe-cannon-apply`.
3. **Mock streaming strategy:** a `useMockAiStream` hook produces a canned,
   subject-aware answer and reveals it chunk-by-chunk via `setInterval` (~30–60ms per
   token batch) with an `isStreaming` flag and a cancellable handle; composer is
   disabled while streaming. *Why interval over promise:* visually indistinguishable
   from a real token stream, so the swap to a socket stream later only replaces the
   producer, not the thread UI.
4. **State:**
   - SWR (mock fetchers) for reads: tools list (existing hook, extended with
     `status: "available" | "comingSoon"`), tutor sessions, summary sources
     (reuse the subject resources/learning mock data), generated artifacts.
   - zustand store `subjectAiStore` for tutor session data (sessions + messages keyed
     by `subjectId`) so conversations survive tab switches within the SPA session.
     Cross-component intent lives in the store as serializable fields (house rule),
     not callbacks. **BE assumption (logged):** real BE will persist sessions/messages
     per (user, subject) with auto-title from the first question; FE hooks are shaped
     (`useQuerySubjectAiSessionsSwr(subjectId)`, `useMutateSubjectAiAskSwr`, …) so the
     mock producer swaps out without UI changes.
   - Session gotchas inherited from `ContentAiChat`: lazy-create session on first send;
     hydrate-once-per-session ref; thread reset only inside `onSwitch`/`onNew`
     handlers; hide empty sessions from the recency list.
5. **Gating:** hub checks membership via the subject mock (`useQuerySubjectSwr` extended
   with `isMember`/enrolled flag). Non-member → cards render disabled with a lock hint
   and a single "Join this workspace" CTA (enroll axis, never "VIP"). Tool surfaces are
   unreachable when gated (guard in the `activeTool` setter, not only the button).
6. **Model picker:** static mock model list (e.g. `ftes-fast`, `ftes-pro`) in the
   composer controls row; selection stored in the zustand store; settings view shows
   the model read-only context + per-tool destructive actions.
7. **Mobile & overlays:** no popovers layered over popovers; conversations/settings are
   sliding in-panel views with a back button; composer dropdowns use `placement="top"`
   variants since the composer sits at the panel bottom; tool surfaces are full-width
   single-column under `sm`.
8. **a11y:** icon-only buttons (send, settings, back, flip, copy, delete) carry
   `aria-label`; streaming thread region is `aria-live="polite"`; view switches move
   focus to the new view's heading; quiz options are real radio groups.

## Risks / Trade-offs

- [Mock answers feel canned] → subject-aware templates (inject subject code/name +
  picked source title) and honest "AI (demo)" labeling; producer isolated in one hook.
- [FE-only persistence loses sessions on reload] → accepted for mock phase; logged as
  the BE assumption; store shape mirrors the expected BE contract to minimize rework.
- [In-tab view state not deep-linkable] → accepted; lifting to sub-routes later is
  additive (decision 1).
- [Grid → hub rework may regress the shipped `subject-workspace-ai` visuals] → hub keeps
  the same card grid as its idle state; only CTAs gain behavior.

## Migration Plan

Pure FE addition behind the existing tab; no data migration. Rollback = revert the
change commit. Archive syncs the four new specs into `openspec/specs/`.

## Open Questions

- Real BE contract for sessions/generation (GraphQL vs socket streaming) — blocked on BE;
  assumption logged in decision 4.
- Whether quiz results should feed the Practice tab stats — deferred until Practice has
  a real attempts model.
