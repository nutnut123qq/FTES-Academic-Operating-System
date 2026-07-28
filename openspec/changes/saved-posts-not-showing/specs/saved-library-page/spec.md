# saved-library-page — Spec delta

## ADDED Requirements

### Requirement: Saved posts reflect the server bookmark list, not just local storage

The `/saved` library SHALL treat the caller's real backend bookmark list
(`GET /api/v1/community/bookmarks/posts`) as the source of truth for WHICH posts are
saved, so a post bookmarked on the server SHALL appear on the Saved page even when this
browser's local `savedItems` store never captured its id (the post was bookmarked on
another device or after a storage clear). On load the page SHALL reconcile the server
bookmark list into the local store with an ADDITIVE merge that never removes and never
overwrites an existing entry, and the merge SHALL be a no-op once every id is already
present so it is safe to invoke on every render. Reconciled entries SHALL preserve the
server's newest-saved-first order and SHALL default their source-context line to the
community label. Resource and course saved sets SHALL keep using the local store
unchanged, and `/community/saved` (which already reads the endpoint directly) SHALL be
unaffected.

#### Scenario: A bookmarked post appears on the Saved page

- **WHEN** an authenticated user opens `/saved` and a post is bookmarked on the server
  (`GET /api/v1/community/bookmarks/posts` returns it) but its id is NOT in this
  browser's local `savedItems` store
- **THEN** the page SHALL merge that post into the store and render it as a saved post row
  with the author, title, and snippet from the bookmark endpoint
- **AND** the row's un-bookmark control SHALL show the saved (filled) state and un-save it
  via `DELETE /api/v1/community/bookmarks/{id}` when pressed

#### Scenario: Reconciliation is additive and loop-safe

- **WHEN** the server bookmark list is merged into the store
- **THEN** posts already present in the store SHALL keep their captured `savedAt` and
  `source` (no overwrite, no duplicate)
- **AND** merging a list whose ids are all already present SHALL leave the store items
  unchanged (a no-op), so the load effect that runs it does not loop

#### Scenario: Posts saved in this browser still work

- **WHEN** a user saves a post on the feed/detail in this browser and opens `/saved`
- **THEN** the post SHALL still render (its id is in both the store and the server list)
- **AND** the newest-saved-first ordering SHALL be preserved
