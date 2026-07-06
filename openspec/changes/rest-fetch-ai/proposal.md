## Why

The shared REST client rollout continues domain by domain. The AI backend exposes several REST controllers (`SessionController`, `JobController`, `QuotaController`, `TranscriptController`, `AdminController`) under `/api/v1/ai`. While some AI chat flows are already covered by GraphQL (`contentAiSessions`, `contentAiHistory`, `myAiQuota`, `askContentAi`) and Socket.IO streaming, a large surface of job/async AI operations, per-feature daily quota, transcripts, and admin model configuration is only available via REST. We need typed REST clients and SWR hooks for those non-overlapping endpoints.

## What Changes

- Add a typed REST module `src/modules/api/rest/ai/` exposing the non-overlapping AI controller contracts.
- Add SWR query hooks for AI reads that GraphQL/socket do not cover (session list/detail, job status, my per-feature quota, transcript, admin model configs/insights).
- Add SWR mutation hooks for AI writes that GraphQL/socket do not cover (session create/archive, job submissions, transcript request, admin model config update).
- Skip REST endpoints that overlap with existing GraphQL/socket flows (real-time SSE send, content-ai session history) and document the rationale in `design.md`.
- Export the AI module from `src/modules/api/rest/index.ts`.

## Capabilities

### New Capabilities
- `rest-fetch-ai`: Typed REST client + SWR hooks for AI REST endpoints not already provided by GraphQL or WebSocket.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/ai/` and `src/hooks/swr/api/rest/{queries,mutations}/`.
- One-line barrel update in `src/modules/api/rest/index.ts`.
- No backend changes, no new dependencies, no changes to existing GraphQL/socket code.
