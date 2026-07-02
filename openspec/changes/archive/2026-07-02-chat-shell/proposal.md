## Why

`/chat` was 404 — the app had no messaging surface (§8) even though the domain is
scoped. This ships a FE-only mock shell so students/advisors can browse
conversations and read a thread, turning `/chat` into a real 200 route. No BE yet;
everything is mock + SWR-shaped for a drop-in swap later.

## What Changes

- Add `features/chat/ChatShell` + `[locale]/chat/page.tsx`: a two-pane messaging
  shell in one scroll context — left = conversation list (clickable rows, selected
  highlighted `bg-accent/10`), right = message thread (mine right / others left) +
  a composer input row with a send button. Send is a no-op (mock).
- Add `useQueryConversationsSwr` + `useQueryConversationMessagesSwr` (mock list of
  ~6 conversations + a ~6-message thread per selected conversation).
- Add `chat.*` i18n (vi/en).

## Capabilities

### New Capabilities
- `chat-shell`: the messaging surface at `/chat` (FE mock shell).

### Modified Capabilities
- (none)

## Impact
- FE: new `features/chat/ChatShell`, `chat/page.tsx`, `useQueryConversationsSwr`;
  i18n. No BE (mock). FE-only mock shell — real send/socket deferred.
