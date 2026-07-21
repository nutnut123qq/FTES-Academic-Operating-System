# subject-discussion-feed

## ADDED Requirements

### Requirement: Post into a subject discussion
The subject workspace "Thảo luận" tab SHALL offer a composer that creates a real community post
anchored to the current subject, optionally with images, and SHALL refresh the tab's feed so the new
post appears without a reload.

#### Scenario: Publish a discussion post
- **WHEN** a learner writes a title and body in the discussion composer and submits
- **THEN** a post is created against the current subject and the feed shows it

#### Scenario: Post with images
- **WHEN** the learner attaches images before submitting
- **THEN** the created post carries those images

#### Scenario: Subject identity
- **WHEN** the composer submits from a route whose segment is the course code
- **THEN** the request anchors the post to the subject's UUID, not the code

#### Scenario: Submit fails
- **WHEN** the create request fails
- **THEN** the draft is kept, an error is shown, and no post is added to the feed

### Requirement: Discussion comments are persisted
Submitting a comment in the discussion tab SHALL send it to the backend and SHALL survive a reload.
The comment MUST appear immediately (optimistic) and MUST be removed again if the write fails.

#### Scenario: Comment persists
- **WHEN** a learner comments on a discussion post and reloads the page
- **THEN** the comment is still there

#### Scenario: Failed comment rolls back
- **WHEN** the comment write fails
- **THEN** the optimistic comment disappears, an error is shown, and the draft text is kept

#### Scenario: Guest is prompted
- **WHEN** a signed-out visitor tries to comment
- **THEN** the authentication prompt opens and nothing is sent
