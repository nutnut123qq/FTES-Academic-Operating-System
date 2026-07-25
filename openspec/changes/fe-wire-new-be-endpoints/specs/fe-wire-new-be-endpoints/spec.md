## ADDED Requirements

### Requirement: Subject practice quiz runs on the subject's real question bank
The subject practice tab SHALL draw its quiz from `GET /api/v1/subjects/{code}/practice/quiz` and grade it through `POST /api/v1/subjects/{code}/practice/quiz/submit`, SHALL render every verdict from the submit response instead of recomputing correctness in the browser, and SHALL state on both the start and the result screen that a practice run is ephemeral and not recorded in the transcript.

#### Scenario: Draw and submit a practice set
- **WHEN** a member picks a question count (5, 10 or 20) and starts a run, answers questions and submits
- **THEN** the FE requests that many questions, posts the answer sheet, and renders score percentage, correct/total, points and skipped count from the submit response, with each question showing the server's verdict, correct keys and explanation

#### Scenario: Multiple-answer question
- **WHEN** a drawn question accepts more than one correct key
- **THEN** the question renders the "select every correct answer" hint and lets the learner toggle several options before submitting

#### Scenario: Subject has no ready questions
- **WHEN** the draw returns an empty bank for the subject
- **THEN** the tab renders the empty state `subjects.practice.quiz.empty` / `emptyDesc` pointing at AI Quiz and offers no draw button

#### Scenario: Practice request fails
- **WHEN** a draw or a submit fails with 401, 403, 404, 409, 429, 503, a `SUBJECT_PRACTICE_INVALID` code, a timeout or a network drop
- **THEN** the matching `subjects.practice.errors.*` message is shown, never a single generic sentence

### Requirement: Flashcard review progress is persisted server-side
The flashcard reviewer SHALL read the subject's curated decks from `GET /api/v1/subjects/{code}/practice/flashcards`, SHALL send every grading to `POST /api/v1/subjects/{code}/practice/flashcards/{cardId}/review`, and SHALL write the SM-2 state returned by the backend (ease, interval, due date, remaining due count) back into its cache so progress survives the session.

#### Scenario: Grade a card
- **WHEN** the learner grades the shown card with one of the four SM-2 buttons
- **THEN** the review is posted, the returned scheduling state replaces the card's cached progress, the due counter updates, and the queue advances

#### Scenario: Due-first queue and status labels
- **WHEN** the deck payload arrives
- **THEN** cards are queued due-first, a due card carries the "Đến hạn" badge, and each card's status renders from `subjects.practice.flashcards.status.<new|learning|reviewing>` matching the backend enum

#### Scenario: Curator manages decks
- **WHEN** a viewer with curate permission opens the deck manager
- **THEN** they can create a deck from `front | back` lines (with a live count of valid cards), add cards to an existing deck, and delete a deck behind a confirm that spells out that every learner's progress goes with it

### Requirement: Tutor conversations are scoped to the subject in view
The subject AI tutor SHALL list and clear only the conversations of the subject being viewed, addressing the backend with the subject's UUID rather than the route's subject code.

#### Scenario: List this subject's conversations
- **WHEN** the tutor conversation list loads on a subject page
- **THEN** the query carries `feature=TUTOR_CHAT` and `subjectId=<subject UUID>` and the panel shows the hint `subjects.aiTools.tutor.subjectOnlyHint`

#### Scenario: Clear this subject's conversations
- **WHEN** the viewer clears conversations from tutor settings
- **THEN** only this subject's conversations are deleted and the toast reports how many were cleared

### Requirement: A viewer can update or delete their own resource rating
The reviews section SHALL prefill the composer from `GET /api/v1/resources/{id}/ratings/me`, SHALL label the write "update" when a rating already exists, and SHALL offer a confirmed delete through `DELETE /api/v1/resources/{id}/ratings/me` that revalidates both the reviews list and the caller's own rating.

#### Scenario: Prefill and update
- **WHEN** a signed-in viewer who already rated the resource opens the reviews section
- **THEN** their stars and review text are prefilled, the submit button reads "Cập nhật đánh giá", and a successful write toasts `resourceHub.reviews.updated` and re-reads the aggregate

#### Scenario: Not rated yet
- **WHEN** the own-rating endpoint answers `200` with a null payload
- **THEN** the composer stays empty and this is treated as a normal state, not an error

#### Scenario: Delete the rating
- **WHEN** the viewer confirms "Xoá đánh giá"
- **THEN** the rating is deleted, the composer resets, the average and count are revalidated, and a repeated delete still reports success because the endpoint is idempotent

### Requirement: Resource comments can be liked
Resource comments — root and reply alike — SHALL toggle through `PUT`/`DELETE /api/v1/resources/comments/{commentId}/like`, SHALL adopt the `{active, likeCount}` returned by the backend instead of counting locally, and SHALL roll back against the cache as it stands at revert time.

#### Scenario: Like a comment
- **WHEN** the viewer taps the heart on a comment
- **THEN** the heart and the counter move immediately, the request is sent, and the server's active flag and count overwrite the optimistic guess when it lands

#### Scenario: Like fails
- **WHEN** the like request fails
- **THEN** the inverse flip is applied to the CURRENT cached page (comments added or removed meanwhile are untouched) and `resourceHub.comments.likeError` is shown

### Requirement: Collection items carry an editable note
A collection item SHALL be annotatable through `PATCH /api/v1/resources/collections/{id}/items/{resourceId}`, the write SHALL keep the item's position in the collection, and a blank note SHALL clear it.

#### Scenario: Save a note
- **WHEN** the owner saves a note on one item of their collection
- **THEN** the note is patched onto the cached item in place, the collection order does not change, and a failure restores the previous note and shows `resourceHub.collections.noteError`

### Requirement: Moderators escalate a report by its report id
The moderation queue SHALL escalate through `POST /api/v1/community/reports/{reportId}/escalate` using the report id carried by the queue row, SHALL only offer the action on rows that carry one, and SHALL treat `409` as the desired outcome rather than a failure to undo.

#### Scenario: Escalate a queued report
- **WHEN** a moderator escalates a row that has a report id
- **THEN** the row is dropped from the queue cache, the report goes to the appeal workflow, and a failure re-inserts the row into the list as it stands at that moment

#### Scenario: Report was already escalated
- **WHEN** the escalation answers `409`
- **THEN** the row stays gone and `communityHub.moderation.escalateAlready` is shown instead of an error inviting a retry

### Requirement: Group images can be removed
Group management SHALL distinguish dropping an unsaved pick from deleting a stored image: an unsaved pick SHALL only leave the preview with no request, while a stored image SHALL be deleted through `DELETE /api/v1/groups/{id}/media/{AVATAR|COVER}` behind a confirm whose description names the image being removed.

#### Scenario: Drop an unsaved pick
- **WHEN** the manager removes an image they picked but have not saved
- **THEN** the preview clears, no request is issued, and no confirm is raised

#### Scenario: Delete a saved image
- **WHEN** the manager confirms removing the saved avatar or cover
- **THEN** the delete is sent, the cached group header is patched so the image disappears everywhere without a refetch, and the group falls back to its initials or the default banner

### Requirement: Pending group invitations have an inbox
The groups hub SHALL list the caller's pending invitations from `GET /api/v1/invitations/me`, SHALL render each row from the payload alone (group, inviter, expiry) without a follow-up request, and SHALL issue no request for a signed-out visitor.

#### Scenario: Signed-in member with invitations
- **WHEN** a signed-in member opens the invitations inbox
- **THEN** each row shows the group, "{name} đã mời bạn tham gia" (or the unknown-inviter variant) and the expiry date or "Không có hạn trả lời", and accepting or declining answers the invitation in place

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor reaches the inbox
- **THEN** no request is fired and the empty/auth surface is shown instead of a 401

### Requirement: Follow state is read in batches
User links rendered in a list SHALL resolve their follow state through one batched read keyed by the deduplicated, sorted set of user ids, and an optimistic follow toggle SHALL patch every cached batch that contains that user.

#### Scenario: One request per rendered list
- **WHEN** a list renders several user links, some of them repeated
- **THEN** the ids are deduplicated and sorted into a single cache key and one batched request per backend page limit is issued, with a failed batch leaving the other batches usable

#### Scenario: Follow toggled from one row
- **WHEN** the viewer follows a user from any row
- **THEN** every cached batch whose id set contains that user is patched, so all links to that user flip together
