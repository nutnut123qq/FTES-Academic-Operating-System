## 1. Foundations (state + mocks + gating)

- [ ] 1.1 Extend `useQuerySubjectAiToolsSwr` with tool `status` (`available`/`comingSoon`); extend subject mock with membership flag for gating
- [ ] 1.2 Create `subjectAiStore` (zustand): tutor sessions/messages keyed by subjectId, selected model, serializable intent fields
- [ ] 1.3 Create `useMockAiStream` hook: interval-chunked subject-aware canned answers, `isStreaming`, cancel, mock failure path
- [ ] 1.4 Create mock generation hooks (SWR-shaped): sessions list, summary, quiz, flashcards — BE-swap-ready signatures; note BE assumptions in JSDoc

## 2. Hub (SubjectAiTools rework)

- [ ] 2.1 Add `activeTool` view state: hub grid ↔ tool surface with back control (guard tool opening on membership)
- [ ] 2.2 Wire card CTAs: available tools open surfaces; OCR card renders coming-soon disabled
- [ ] 2.3 Non-member locked hub: disabled cards + lock hint + join/enroll CTA
- [ ] 2.4 Hub loading skeleton + error-with-retry states

## 3. Tutor chat

- [ ] 3.1 `SubjectAiTutor` surface: thread with user/assistant bubbles, streaming indicator, `aria-live` region, empty state with suggested prompts
- [ ] 3.2 Composer-in-box: flat input + [model picker ▾ · settings · send] inside one bounded box; picker opens upward; icon-only buttons with aria-labels
- [ ] 3.3 Sessions: lazy-create on first send, auto-title from first question, hide empty sessions, thread reset only in switch/new handlers
- [ ] 3.4 In-panel conversations view: recency list + search + new + per-row delete + empty state; back control; focus to heading
- [ ] 3.5 In-panel settings view: model read-only context + destructive clear action
- [ ] 3.6 Streaming error/cancel handling: keep partial answer, retry, re-enable composer

## 4. Summary tool

- [ ] 4.1 `SubjectAiSummary`: source picker from subject resources/lessons mock + generate action
- [ ] 4.2 Output: loading skeleton → structured mock summary (key points + abstract) with copy + regenerate
- [ ] 4.3 Empty (link to Resources tab) + error-with-retry states; preserve previous summary on failure

## 5. Quiz + flashcards

- [ ] 5.1 `SubjectAiQuiz`: source + question-count options → generation loading → mock MCQ quiz (radio groups)
- [ ] 5.2 Quiz grading: submit → score + per-question marking + retry/new-quiz actions
- [ ] 5.3 `SubjectAiFlashcards`: generate deck → flip card (click/keyboard) + prev/next + position indicator + end state (restart/regenerate)
- [ ] 5.4 Shared error/empty handling for both generators

## 6. i18n + polish + verify

- [ ] 6.1 i18n `subjects.aiTools.*` additions for all new strings (vi + en), no hardcoded copy
- [ ] 6.2 Mobile pass: single-column in-panel surfaces below `sm`, no popover-on-popover; a11y pass (aria-labels, focus moves, live region)
- [ ] 6.3 Verify `npm run build` (webpack) green + `tsc --noEmit` clean
