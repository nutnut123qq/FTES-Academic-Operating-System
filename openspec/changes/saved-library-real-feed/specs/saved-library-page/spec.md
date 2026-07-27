# saved-library-page — Spec delta

## ADDED Requirements

### Requirement: Saved posts hydrate from the real bookmark endpoint

Post rows on `/saved` (the "Bài viết" tab and post rows under "Tất cả") SHALL resolve
their author, title, and snippet from the caller's real backend bookmarks
(`GET /api/v1/community/bookmarks/posts`, via the shared `useQueryBookmarkedPostsSwr`
hook), NOT by joining saved post ids against a community/group/subject feed fetched with
a placeholder id. The page SHALL NOT issue any request carrying the pseudo-id
`"saved-library"` (previously `GET /groups/saved-library/feed` and the subject feed with
`subjectId: "saved-library"`, both of which returned `400 Bad Request` because the
backend forces the path id to `UUID`). The source-context line (community / group name /
subject name) MAY still come from the `source` metadata captured at save time. A saved
post id that is not present in the loaded bookmark pages SHALL be dropped silently rather
than triggering a broken request.

#### Scenario: Opening /saved does not emit a 400

- **WHEN** an authenticated user opens `/saved` with saved posts
- **THEN** the page SHALL request `GET /api/v1/community/bookmarks/posts` for post data
- **AND** the page SHALL NOT request `GET /groups/saved-library/feed` nor query the
  subject feed with `subjectId: "saved-library"`
- **AND** no request returns `400 Bad Request` from the pseudo-id

#### Scenario: A saved post row shows real backend data

- **WHEN** the "Bài viết" tab renders a saved post
- **THEN** the row's author name, title, and snippet SHALL come from the bookmark
  endpoint's hydrated `PostResponse`
- **AND** the source-context line SHALL come from the `source` metadata saved at bookmark
  time (falling back to the community label when absent)

#### Scenario: Real group and subject feeds are unaffected

- **WHEN** a user opens a real group feed or a subject "Thảo luận" feed
- **THEN** those surfaces SHALL still query with the entity's real UUID id
- **AND** the removal of the `/saved` placeholder-id joins SHALL NOT change their behavior
