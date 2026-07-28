# community-feed-ui (delta)

## ADDED Requirements

### Requirement: Community tab feed honours the Newest/Oldest time sort

The community tab feed SHALL honour the selected Newest/Oldest sort by ordering posts on their
creation time — Newest = `created_at` descending, Oldest = `created_at` ascending — passing the sort
to the `feed(tab, page, campus, sort)` query and including it in the SWR cache key so switching sort
refetches from the first page. The TRENDING tab SHALL keep its engagement order and SHALL hide the
Newest/Oldest control rather than apply it as a silent no-op.

#### Scenario: Newest orders the tab feed by created_at descending

- **WHEN** the user views the feed with the Newest sort selected
- **THEN** posts are shown newest-first by `created_at`, regardless of engagement

#### Scenario: Switching to Oldest refetches the same tab feed ascending

- **WHEN** the user switches from Newest to Oldest on a non-Trending tab
- **THEN** the SWR key changes and the feed refetches page 1 ordered oldest-first

#### Scenario: Trending hides the sort control

- **WHEN** the user is on the Trending tab
- **THEN** the Newest/Oldest control is not shown and the feed stays in engagement order
