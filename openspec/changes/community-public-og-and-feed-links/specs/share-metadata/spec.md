# share-metadata (delta)

## ADDED Requirements

### Requirement: Community post metadata reads an anonymous public card

`/[locale]/community/[postId]` SHALL build its share metadata from a PUBLIC, token-free read
(`GET /community/public/posts/{id}`), never from the authenticated post-detail endpoint.

The reason is structural, not stylistic: `generateMetadata` runs on the server, which carries no
bearer token, so the gated endpoint could only ever answer 401 there — every share link fell back to
the generic community copy while still paying for a doomed request on every render. The public read
SHALL be marked unauthenticated on the client adapter as well, so it never triggers a pointless token
refresh.

The public card SHALL be a narrow projection — id, title, plain-text excerpt, first image, resolved
author display name, creation time — and SHALL NOT be modelled as a subset of the authenticated post
response: it is what an anonymous caller (our own server render, plus every link crawler) is allowed
to see.

The read SHALL be memoized per request. Its excerpt arrives already plain (markup and URLs stripped
server-side), so the description only needs truncating to ~160 characters.

#### Scenario: Sharing a public post

- **WHEN** a public community post URL is unfurled
- **THEN** the card shows the post's own title, its excerpt and its first image

#### Scenario: Sharing a post that is not publicly readable

- **WHEN** the URL points at a private-group post, a draft/hidden post, a deleted post, or an id that
  does not exist
- **THEN** the read fails identically in every case and the page falls back to the generic community
  share copy — the card never reveals that a non-public post exists

#### Scenario: No wasted request

- **WHEN** the metadata read runs
- **THEN** it is issued without authentication and without an attempted token refresh
