## Layout — two-pane messaging shell

A standard messaging surface in one scroll context (no separate rails), mirroring
the house feature/catalog canon:
- `mx-auto max-w-6xl p-6` column; title + subtitle.
- Grid `md:grid-cols-[minmax(0,20rem)_1fr]`: left pane = conversation list, right
  pane = thread + composer. Stacks to one column on mobile.
- Left rows = clickable `<button>` (open-in-place, not navigation): avatar initials
  badge (`bg-accent/10 text-accent`) + name + last-message preview + unread count
  pill. Selected row highlighted `bg-accent/10`; others `hover:bg-default/40`.
- Right pane = header (selected name) + bubble thread + composer. Bubbles: mine
  right-aligned `bg-accent/10`, others left-aligned `bg-default/40`, time caption
  under each. Composer = plain `<input>` (house class) + icon-only send `Button`
  (`PaperPlaneTiltIcon`, `aria-label`, `color="accent"`).
- Empty state (`chat.empty`) with `ChatCircleIcon` when no conversation selected.

## Data
`useQueryConversationsSwr` — mock conversation list (~6 rows), SWR-shaped.
`useQueryConversationMessagesSwr(conversationId)` — mock thread (~6 messages),
keyed by id so it refetches when selection changes; null key when nothing selected.
`ponytail:` note marks the BE swap point (`conversations()` / `messages(id)`).

## State
`useState` for the selected conversation id (in `ChatShell`). No global store —
selection is local to the surface.

## Not doing
- No real send / socket / typing indicators — composer is a mock no-op.
- No conversation search, pagination, or multi-session semantics (6 mock rows).
- No BE; all data is deterministic mock.
