## Why

The Subject Workspace AI tab (`/subjects/[subjectId]/ai` → `SubjectAiTools`) is a static
catalog of 5 tool cards with no-op CTAs — the workspace advertises AI but delivers none.
The house already has a proven AI chat pattern (`ContentAiChat` in the learn area:
composer-in-box, multi-session, in-panel views). This change turns the AI tab into a
functional per-subject AI hub (FE-only, mock BE) by reusing those patterns.

## What Changes

- Upgrade the AI tab from a static card catalog into an AI hub: tool cards become real
  entry points that open working tool surfaces inside the tab.
- **Subject AI Tutor**: a chat surface scoped to the subject — multi-session
  conversations (list/search/new/delete), composer-in-box (flat input + model picker +
  settings + send inside one box), mock streaming responses generated FE-side.
- **Summary generator**: pick a subject resource/lesson → mock generated summary with
  loading/skeleton state, copy action, regenerate.
- **Quiz generator + flashcards**: pick source material + options → mock generated quiz
  (answerable, graded FE-side) and flashcards (flip deck), with generation loading state.
- Gating: tools require the viewer to be a workspace member (enrolled) — non-members see
  an enroll/join CTA, never a broken tool.
- i18n vi/en for every new string; a11y (icon-only buttons carry `aria-label`, focus
  management on view switches); mobile-safe (all secondary surfaces render in-panel —
  no popover-on-popover, per house rule).
- OCR card remains a "coming soon" shell (no surface this change).
- Conversation/session persistence is a stated BE assumption: FE persists mock sessions
  per subject (in-memory + zustand) shaped for a drop-in BE swap; no real API is invented.

## Capabilities

### New Capabilities
- `subject-ai-hub`: the AI tab as hub — tool cards as entry points, tool surface routing
  within the tab, membership gating, loading/error/empty states.
- `subject-ai-tutor`: subject-scoped AI chat — sessions, composer, model picker, mock
  streaming, in-panel conversations/settings views.
- `subject-ai-summary`: resource/lesson picker → mock summary output with states.
- `subject-ai-quiz-flashcards`: mock quiz + flashcard generation from subject material.

### Modified Capabilities
- (none — no existing spec in `openspec/specs/` covers the AI tab; the prior
  `subject-workspace-ai` change shipped without a spec delta)

## Impact

- FE only: `src/components/features/subject/SubjectAiTools/**` (rework + new tool
  subcomponents), `src/components/features/subject/hooks/*` (new mock SWR hooks),
  a small zustand store for tutor sessions, i18n message catalogs (vi/en).
- No `src/` edits in this authoring change — implementation happens at apply time.
- No BE, no new dependencies. `npm run build` (webpack) + `tsc --noEmit` must stay green.
