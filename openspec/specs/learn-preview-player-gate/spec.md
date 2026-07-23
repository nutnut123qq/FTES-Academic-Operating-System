# learn-preview-player-gate Specification

## Purpose
Define the preview (PREVIEW) gating behavior for VIDEO lessons in the learn reader: mounting the player from the stream reference, a client-side preview window on YouTube playback, a post-modal lock overlay, and leaving FULL playback plus DOCUMENT teasers unchanged.

> **Status (2026-07-23): partially SUPERSEDED by BE change `preview-youtube-ref-gate` (FTES-AOS-Backend, commit c08425c, 2026-07-22).** The backend now deliberately returns `videoRef: null` for every PREVIEW YouTube lesson, so the PREVIEW player never mounts in the real environment. Consequently the client-gate family below — the *becomes-watchable* path of "PREVIEW video lessons render a playable, gated player", the whole of "Client-enforced preview window on YouTube playback", and "Post-gate lock overlay with re-open CTA" — is **conditional / dead-path**: it takes effect only if/when the backend delivers a `videoRef` for PREVIEW again. What is actually live and verified today is the no-ref branch (scenario "No ref from either source hides the player") plus the unchanged FULL-playback and DOCUMENT-teaser guarantees. The core client-gate E2E (previewSeconds → pause → modal → overlay; replay/seek cannot bypass) has **not** been executed, because no ref is delivered to mount the player; only the no-ref, FULL, and DOCUMENT paths were verified. The equivalent security outcome (no watch-to-end, charge to unlock) is reached through the no-ref + paywall path. The FE implementation is retained in code so the gate self-activates without a new change should the backend re-enable PREVIEW refs.

## Requirements
### Requirement: PREVIEW video lessons render a playable, gated player
The learn reader SHALL mount the lesson video player for a VIDEO lesson whose viewer access level is PREVIEW even when the curriculum payload carries no `videoRef`, resolving the playable reference from the stream response (`stream.videoRef`); while the stream response is pending it SHALL show a video-shaped skeleton instead of rendering nothing.

> **Conditional:** the *becomes-watchable* path depends on the stream response delivering a `videoRef` for PREVIEW YouTube. As of BE `preview-youtube-ref-gate` (2026-07-22) that ref is `null`, so only the "No ref from either source hides the player" scenario is live in the deployed system today.

#### Scenario: Preview YouTube lesson becomes watchable
- **WHEN** a signed-in user without entitlement opens a PREVIEW VIDEO lesson whose video source is YouTube and the stream response returns `provider = "YOUTUBE"` with a `videoRef`
- **THEN** the YouTube player renders with the preview countdown chip
- **AND** playback starts from the beginning of the video

#### Scenario: No ref from either source hides the player
- **WHEN** the stream response resolves without a `videoRef` and the curriculum `videoRef` is null
- **THEN** the video block renders nothing (current behavior preserved)

### Requirement: Client-enforced preview window on YouTube playback
The YouTube lesson player SHALL track playback time via the YouTube IFrame API and, in PREVIEW mode, SHALL pause playback when the current time reaches `previewSeconds` and automatically open the PackageGateModal. The gate SHALL be a persistent state, not a one-shot event: after the limit has been reached, any subsequent transition to a playing state SHALL be paused and seeked back to the limit immediately, and any seek beyond `previewSeconds` (before or after gating) SHALL be clamped back to the limit.

> **Conditional / SUPERSEDED (dead-path today):** this requirement and its scenarios take effect only once the player mounts, which requires a PREVIEW `videoRef` from the stream response. BE `preview-youtube-ref-gate` (c08425c, 2026-07-22) returns `videoRef: null` for PREVIEW YouTube, so the player never mounts and these guarantees are unreachable in the deployed system; the equivalent security outcome is achieved by the no-ref branch (hide player + paywall). The scenarios below are retained for the future case where the backend re-enables PREVIEW refs; their core E2E has not been executed.

#### Scenario: Reaching the limit pauses and opens the gate modal
- **WHEN** a PREVIEW viewer's playback time reaches `previewSeconds`
- **THEN** the video pauses
- **AND** the PackageGateModal opens automatically without further user action
- **AND** the preview-limit report is posted once per lesson per session

#### Scenario: Replaying after dismissing the modal stays gated
- **WHEN** the viewer closes the PackageGateModal and presses play on the video again
- **THEN** playback is paused again at (or immediately after reaching) the preview limit
- **AND** the video never plays past `previewSeconds` to the end

#### Scenario: Seeking past the limit is clamped
- **WHEN** a PREVIEW viewer seeks the player beyond `previewSeconds`
- **THEN** the playhead is moved back to `previewSeconds`

#### Scenario: IFrame API failure never falls back to an ungated embed in PREVIEW
- **WHEN** the YouTube IFrame API fails to load for a PREVIEW viewer
- **THEN** the player area shows an error state with an enroll CTA instead of a plain ungated YouTube iframe

### Requirement: Post-gate lock overlay with re-open CTA
After the preview limit has been reached, whenever the PackageGateModal is closed the video SHALL remain covered by a lock overlay that dims the player, blocks pointer interaction with the underlying iframe, states that the preview has ended, and offers a primary call-to-action that re-opens the PackageGateModal. The CTA copy SHALL follow the premium-unlock-is-enroll rule (enroll/unlock the course — never a separate VIP/membership). The overlay SHALL persist until the lesson changes or the viewer's access becomes FULL.

> **Conditional:** reachable only after the preview limit is hit, which requires the PREVIEW player to mount (a `videoRef` from the stream). Dead-path in the deployed system today per BE `preview-youtube-ref-gate` (see Purpose).

#### Scenario: Overlay appears when the modal is dismissed
- **WHEN** a gated PREVIEW viewer closes the PackageGateModal
- **THEN** a lock overlay covers the video with the "preview ended" message and an enroll CTA
- **AND** clicking the video underneath does not resume playback

#### Scenario: Overlay CTA re-opens the gate modal
- **WHEN** the viewer activates the overlay CTA
- **THEN** the PackageGateModal opens again with the same course/lesson/package context

#### Scenario: Purchase unlocks in place
- **WHEN** the viewer completes a purchase from the PackageGateModal and the lesson/stream queries revalidate to `mode = "FULL"`
- **THEN** the overlay and countdown chip are removed
- **AND** the viewer can play the full video without any gate

### Requirement: Full-access playback and document teasers unchanged
A viewer whose stream response resolves `mode = "FULL"` SHALL play the video without countdown chip, gate, or overlay. DOCUMENT lessons SHALL keep their existing server-cut teaser and paywall behavior with no client-side changes from this feature. All lesson-video rendering SHALL go through the gated video block — no UI path may embed a lesson's video outside it.

#### Scenario: Purchased user watches to the end
- **WHEN** a user with FULL access opens the same YouTube VIDEO lesson
- **THEN** the video plays to the end with no pause, no modal, and no overlay

#### Scenario: Document preview regression guard
- **WHEN** a PREVIEW viewer opens a DOCUMENT lesson
- **THEN** the server-cut teaser, gradient fade, and paywall render exactly as before this change

