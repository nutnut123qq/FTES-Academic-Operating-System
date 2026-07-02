## 1. Shell
- [x] 1.1 `useQueryConversationsSwr` + `useQueryConversationMessagesSwr` — mock list + per-conversation thread (SWR-shaped)
- [x] 1.2 `features/chat/ChatShell` — two-pane list + thread + composer (selected `bg-accent/10`, bubbles mine right / others left)
- [x] 1.3 `[locale]/chat/page.tsx` renders ChatShell

## 2. Wiring
- [x] 2.1 i18n `chat.*` (vi/en)

## 3. Verify
- [x] 3.1 eslint clean on new files (build/tsc verified centrally; i18n keys merged by orchestrator)
