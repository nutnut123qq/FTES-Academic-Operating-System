# community-feed-threads (delta)

## ADDED Requirements

### Requirement: Feed snippets show bare URLs, not authored angle brackets

The feed mapper SHALL strip the surrounding angle brackets from CommonMark autolinks in the snippet,
reusing the SAME unwrap helper the post detail page uses — the logic SHALL NOT be duplicated. The row
component SHALL keep rendering the snippet as plain text; nothing is linkified.

This is needed because the feed row prints its snippet as PLAIN TEXT — the whole row already sits
inside one link that covers it, so inserting an anchor into the snippet would nest anchors — and an
autolink written by the author (`<https://…>`) therefore leaks its angle brackets onto the screen.

Only the wrapping `<`…`>` of an http(s) autolink SHALL be removed. Angle brackets used as ordinary
text (`a < b`, `b > c`) and markup-looking fragments (`<div>`) SHALL be left untouched — a naive
"delete every angle bracket" implementation is the failure this must not become.

Because the mapper is shared with community search, search results inherit the same cleanup; the
quoted/repost card opened from the feed does too.

#### Scenario: Author wrote an autolink

- **WHEN** a post body contains `<https://a.vn/x>` and appears in the feed
- **THEN** the row's snippet reads `https://a.vn/x` with no angle brackets, still as plain text

#### Scenario: Bare URL

- **WHEN** the snippet contains a bare `https://…`
- **THEN** it is unchanged

#### Scenario: Angle brackets that are not autolinks

- **WHEN** the snippet contains `a < b`, `b > c`, or `<div>`
- **THEN** those characters are left exactly as written
