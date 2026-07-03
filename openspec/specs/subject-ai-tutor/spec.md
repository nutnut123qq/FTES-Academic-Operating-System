# subject-ai-tutor Specification

## Purpose
TBD - created by archiving change workplace-ai. Update Purpose after archive.
## Requirements
### Requirement: Subject-scoped tutor chat with mock streaming
The tutor surface SHALL provide a chat thread scoped to the current subject. Responses
are generated FE-side (mock) and SHALL stream into the thread progressively. All strings
SHALL be localized (vi/en) and the answer region SHALL announce updates politely to
assistive tech (`aria-live="polite"`).

#### Scenario: Ask and receive a streamed answer
- **WHEN** a member submits a question from the composer
- **THEN** the question appears as a user bubble and a mock answer streams in chunk-by-chunk with a visible streaming indicator
- **AND** the answer references the subject context (subject code/name) so scoping is evident
- **AND** the composer send action is disabled while streaming

#### Scenario: Empty thread state
- **WHEN** the tutor opens with no messages in the current session
- **THEN** a localized empty state with 2–4 subject-scoped suggested prompts is shown
- **AND** tapping a suggestion sends it as the first question

#### Scenario: Streaming failure
- **WHEN** the mock stream errors or is cancelled
- **THEN** the partial answer is kept, a localized error note with a retry action is shown, and the composer re-enables

### Requirement: Composer is a single box with inline controls
The tutor composer SHALL be one bounded box containing a flat input (no nested bordered
field) on top and a controls row — model picker, settings trigger, send — inside the same
box at the bottom. There SHALL be no control toolbar at the top of the chat surface.

#### Scenario: Composer layout and controls
- **WHEN** the tutor surface renders
- **THEN** the composer box shows the flat input above a row of [model picker] … [settings] [send]
- **AND** send and settings are icon-only buttons with `aria-label`s
- **AND** the model picker dropdown opens upward (composer sits at the panel bottom)

#### Scenario: Model selection
- **WHEN** the member picks a different model from the composer's model picker
- **THEN** the selection persists for subsequent questions in the SPA session and is reflected in the settings view (read-only context)

### Requirement: Multi-session conversations per subject
The tutor SHALL support multiple named conversations per subject: a conversations view
listing sessions by recency with search and a "new conversation" action, per-row delete,
and lazy session creation. Sessions persist FE-side for the SPA session; server
persistence per (user, subject) is a stated BE assumption.

#### Scenario: Lazy session creation and auto-title
- **WHEN** the member starts a new conversation and sends the first message
- **THEN** the session is created only at that first send (no empty session before)
- **AND** the session title defaults to the first question

#### Scenario: Switch between conversations
- **WHEN** the member selects another session in the conversations view
- **THEN** the thread is replaced by that session's messages and the view returns to the chat
- **AND** switching never wipes a message that was just sent in the previous session

#### Scenario: List, search, and empty list
- **WHEN** the conversations view opens
- **THEN** sessions with at least one message are listed most-recent-first; empty sessions are hidden
- **WHEN** the member types in the search field
- **THEN** the list filters by title/content match
- **WHEN** there are no sessions
- **THEN** a localized empty state with a "new conversation" action is shown

#### Scenario: Delete a conversation
- **WHEN** the member deletes a session from its row (icon-only button with `aria-label`)
- **THEN** the session and its messages are removed; if it was active, the chat resets to a fresh (uncreated) conversation

### Requirement: Secondary tutor views render in-panel
Conversations and settings SHALL render as in-panel views that replace the chat content
(with a back control), never as a modal/drawer/popover stacked over the tool surface.
The settings view SHALL show the active model as read-only context and host destructive
chat actions.

#### Scenario: In-panel navigation
- **WHEN** the member opens conversations or settings from the chat surface
- **THEN** the view slides in replacing the chat within the same panel — no new overlay layer is created
- **AND** a back control (with `aria-label`) returns to the chat, and focus moves to the opened view's heading

#### Scenario: Works on mobile
- **WHEN** the tutor is used below the `sm` breakpoint
- **THEN** all views remain usable single-column in-panel with no popover-on-popover stacking
