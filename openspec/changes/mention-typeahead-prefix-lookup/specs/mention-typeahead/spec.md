# mention-typeahead

## MODIFIED Requirements

### Requirement: Looking up mentionable users
The `@` typeahead SHALL look users up by PREFIX via `GET /api/v1/profiles/mentionable`, NOT via
the search index. The index matches whole words, so a few leading characters return nothing and
the popup only ever appears once the full username has been typed.

The lookup SHALL stay non-throwing: a failed or forbidden request yields an empty list so a
typing author is never interrupted by an editor-level error. A blank query SHALL NOT issue a
request. Rows without a username SHALL be dropped, since the serialized mention link needs one.

#### Scenario: Short prefix produces suggestions
- **WHEN** the author types `@fro`
- **THEN** the lookup is issued with `fro` and a user named `frostes` can appear in the popup

#### Scenario: Blank query issues no request
- **WHEN** the author types `@` followed by only whitespace
- **THEN** no request is made and the popup stays hidden

#### Scenario: Failed lookup degrades quietly
- **WHEN** the lookup rejects
- **THEN** an empty list is returned and no error surfaces in the editor
