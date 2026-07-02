## Why

§5 resource hub: "Các tài liệu cho phép comment" — documents must support comments.
Today `ResourceDetail` renders a READ-ONLY mock comments list (no composer, no delete,
no auth gating, no states). Users cannot discuss a document.

## What Changes

- Add an interactive comments section to the resource detail page
  (`/resources/[resourceId]`): composer (textarea + submit) + comment list
  (author, avatar, relative time), newest-first, optimistic append.
- Auth gating: guests are prompted with `AuthenticationModal` instead of posting.
- Full UI states: loading skeleton, empty state, submit error (rollback + retry),
  character limit (500) with counter, delete-own-comment.
- Explicit separation of surfaces: **comments = free-form discussion on the detail
  page**; **reviews/ratings = 5-star + review text on `/resources/[resourceId]/reviews`**
  (existing `resource-rating`). The comments section carries no star input and links
  to the reviews page for rating.
- i18n `resourceHub.comments.*` (vi/en); a11y labels for composer, submit, delete.
- FE-only with mock SWR hooks; BE contract assumption documented in design.md.

## Capabilities

### New Capabilities
- `resource-comments`: interactive comments on a resource detail page — composer,
  list, optimistic append, auth gating, delete-own, states, i18n/a11y, and the
  comments-vs-reviews surface separation.

### Modified Capabilities
- (none — no main spec exists yet for resource detail; the read-only mock list is
  implementation-only and is superseded by this capability)

## Impact

- `src/components/features/resource/ResourceDetail/` (replace inline mock list with
  a `ResourceComments` sub-feature).
- `src/components/features/resource/hooks/` (new mock SWR query + mutation hooks).
- `src/messages/vi.json`, `src/messages/en.json` (`resourceHub.comments.*`).
- No BE, no new deps. `npm run build` (webpack) + `tsc --noEmit` stay green.
- `ResourceRating` / `/reviews` route untouched.
