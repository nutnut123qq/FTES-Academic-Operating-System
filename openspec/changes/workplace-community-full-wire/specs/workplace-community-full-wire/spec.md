## ADDED Requirements

### Requirement: Document-QA panel on a resource
The resource detail page SHALL render a Document-QA panel that asks `POST /api/v1/ai/document-qa` about the current resource, SHALL render every state (answer, indexing, quota, model, access, failure) from `next-intl` keys under `resourceHub.aiQa`, and SHALL NOT send a request for a signed-out viewer.

#### Scenario: Ask a question about the resource
- **WHEN** a signed-in viewer submits a question in the panel
- **THEN** the panel appends the question turn, calls `askDocumentQa` with the resource id, the question and the selected model, and renders the answer as markdown with its citations and an "answered by {model}" caption

#### Scenario: Starter suggestions on an empty thread
- **WHEN** the thread has no turn yet
- **THEN** the panel offers the three starter questions (`aiQa.suggestions.summarize`, `aiQa.suggestions.keyPoints`, `aiQa.suggestions.terms`) and sending one behaves exactly like a typed question

#### Scenario: Document is still being indexed
- **WHEN** the backend answers that the document is not ready (quota refunded)
- **THEN** the turn renders the soft notice `aiQa.processing` plus a retry action that resends the SAME question and does not count as a new answer

#### Scenario: Quota, model or access rejection
- **WHEN** the request fails with a quota, disallowed-model or forbidden error
- **THEN** the turn renders `aiQa.quotaHit`, `aiQa.modelNotAllowed` (falling back to the default model) or `aiQa.accessDenied` respectively, instead of the generic failure line

#### Scenario: Signed-out viewer opens the panel
- **WHEN** a signed-out viewer tries to send a question
- **THEN** no request is issued and the auth prompt is raised with the context `auth.context.aiQa`
