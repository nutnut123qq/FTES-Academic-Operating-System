# blog — Delta

## ADDED Requirements

### Requirement: Blog article engagement
The `/[locale]/blog/[slug]` article page SHALL render an engagement zone below the article
body (above the related-posts strip) consisting of (a) a post reaction bar — a heart toggle
with the post's `emojiCount`, wired to `PUT /blog/posts/{id}/reaction` via
`usePostReactToBlogPostSwr` — and (b) a FLAT comment thread wired to the existing blog REST
hooks: paginated list (`useGetBlogCommentsSwr`, size 20, "load more" while `hasNext`),
a composer for signed-in users (`usePostCreateBlogCommentSwr`, max 5000 chars), owner-only
edit/delete (`usePostUpdateBlogCommentSwr`/`usePostDeleteBlogCommentSwr`, owner =
`comment.userId === currentUser.id`), and a per-comment heart toggle
(`usePostReactToBlogCommentSwr`). Comment authors SHALL render via `UserLink` when
`authorUsername` is present and fall back to an avatar-seed + localized generic label when
it is null. Guests SHALL be able to READ comments (the list endpoint is public) but every
write control SHALL route through `useRequireAuth` and open the sign-in modal instead of
firing a request. All strings SHALL be localized (vi + en).

#### Scenario: Guest reads but cannot write
- **GIVEN** a signed-out visitor on `/blog/<slug>` of a post with seeded comments
- **WHEN** the engagement zone renders
- **THEN** the comments are visible, no composer textarea renders (a "sign in to comment" affordance shows instead)
- **AND** clicking the post heart or a comment heart opens the authentication modal and sends no request

#### Scenario: Signed-in user comments
- **GIVEN** a signed-in user typing a comment
- **WHEN** they submit
- **THEN** `POST /blog/posts/{postId}/comments` fires and the returned comment appends to the visible thread with the user as author, and the draft clears

#### Scenario: Owner edits and deletes own comment
- **GIVEN** a signed-in user viewing a comment they authored
- **WHEN** they open the comment's actions
- **THEN** Edit (inline, `PUT /blog/comments/{id}`) and Delete (confirm dialog, `DELETE /blog/comments/{id}`) are available, while comments by other users expose no such actions

#### Scenario: Reaction toggle updates count
- **WHEN** a signed-in user clicks the post heart twice
- **THEN** each click reflects the returned `{reacted, emojiCount}` — the count increments then returns to its prior value

#### Scenario: Load more comments
- **GIVEN** the first comment page returned `hasNext: true`
- **WHEN** the user activates "load more"
- **THEN** the next page is fetched and appended (deduplicated by id) and the control hides once `hasNext` is false

#### Scenario: Author fallback for unresolved usernames
- **GIVEN** a comment whose `authorUsername` is null (legacy user id or older BE)
- **WHEN** the comment renders
- **THEN** it shows an avatar seeded by `userId` and the localized generic author label instead of crashing or showing a raw id

## MODIFIED Requirements

### Requirement: Blog article page
The system SHALL serve a public `/[locale]/blog/[slug]` page that renders a single article: a back
link to the blog, header chips (pillar and, when applicable, premium), an optional cover image, the
markdown body rendered via `MarkdownContent`, a sticky reading-progress indicator, an engagement
zone (post reaction bar + flat comment thread — see "Blog article engagement"), and a
"More in {category}" related-posts strip.

#### Scenario: Article renders by slug
- **WHEN** a visitor opens `/blog/<slug>` for an existing post
- **THEN** the article header, cover (if present), and markdown body render, and a reading-progress bar reflects scroll position

#### Scenario: Engagement zone position
- **WHEN** an existing article renders
- **THEN** the reaction bar and comment thread appear after the markdown body and before the related-posts strip

#### Scenario: Premium article is gated
- **WHEN** the requested article is premium and the reader is not entitled (`isLocked`)
- **THEN** the body is truncated and a members-only lock card is shown in place of the remainder

#### Scenario: Related posts strip
- **WHEN** other posts exist in the same pillar as the current article
- **THEN** a "More in {category}" strip lists up to three of them, excluding the current article; otherwise the strip is hidden

#### Scenario: Unknown slug
- **WHEN** the slug does not resolve to a post
- **THEN** the page shows the localized "article not found" content and a way back to the blog
