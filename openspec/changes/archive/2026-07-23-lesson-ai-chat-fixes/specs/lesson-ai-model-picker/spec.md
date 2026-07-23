# lesson-ai-model-picker

## ADDED Requirements

### Requirement: Model picker inside the composer box
The system SHALL render a model dropdown inside the single composer box (controls row under the flat textarea, per rule ai-chat-composer-box-controls-and-settings-modal), opening upward (`placement="top start"`), fed by `GET /api/v1/ai/models` via a SWR hook, defaulting to the catalog `defaults.chat` (fallback `openai/gpt-oss-120b`); the picker SHALL hide when the catalog is empty or errored while chat keeps working without a model.

#### Scenario: Picker lists catalog models
- **WHEN** the catalog returns models
- **THEN** the composer shows the current model's short name and the dropdown lists all catalog ids

#### Scenario: Catalog outage degrades silently
- **WHEN** `GET /ai/models` fails
- **THEN** no picker renders and sending messages still works (no `model` field sent)

### Requirement: Selected model rides every message
The system SHALL persist the chosen model in the overlay zustand store (survives the popover remount) and include it as `model` in the create-session and send-message request bodies.

#### Scenario: Model survives reopening the panel
- **WHEN** a user picks a model, closes and reopens the ask-AI panel
- **THEN** the same model is still selected and sent with the next message

### Requirement: Answer bubble shows the serving model
The system SHALL read `modelUsed` from the SSE `done` event and render it as a muted caption under the assistant answer; when absent (older BE) no caption renders. An `AI_MODEL_NOT_ALLOWED` error event SHALL surface a translated message and reset the picker to the default.

#### Scenario: Model caption after streaming
- **WHEN** an answer finishes with `done` data `{messageId, tokenOutput, modelUsed: "deepseek/deepseek-chat"}`
- **THEN** the bubble shows "Trả lời bởi deepseek/deepseek-chat"

#### Scenario: Disallowed model recovers
- **WHEN** the BE answers with error `AI_MODEL_NOT_ALLOWED`
- **THEN** the user sees the modelNotAllowed message and the picker returns to the default model
