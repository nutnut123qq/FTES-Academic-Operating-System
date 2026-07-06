## Context

The shared REST client (`restRequest`) powers multiple domains. The AI backend (`vn.ftes.aos.ai.web`) exposes five REST controllers under `/api/v1/ai`. The frontend already has GraphQL and Socket.IO coverage for content-AI chat (`contentAiSessions`, `contentAiHistory`, `askContentAi` with chunked socket responses, `myAiQuota`). This change adds typed REST clients and SWR hooks only for the AI REST endpoints that are not already covered by those channels.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/ai/` for all non-overlapping AI controller endpoints.
- Add SWR query hooks for read operations not covered by GraphQL/socket (session list/detail, job status, per-feature quota, transcript status, admin model configs/insights).
- Add SWR mutation hooks for write operations not covered by GraphQL/socket (session create/archive, job submissions, transcript request, admin model config update).
- Update `src/modules/api/rest/index.ts` to re-export `./ai`.
- Pass `npx tsc --noEmit` and `npm run build -- --webpack`.

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not duplicate GraphQL/socket flows:
  - `POST /ai/sessions/{id}/messages` (SSE streaming) overlaps with `askContentAi` Socket.IO flow.
  - `GET /ai/sessions/{id}/messages` overlaps with GraphQL `contentAiHistory`.
  - GraphQL `myAiQuota` exposes a unified credit quota; we still expose REST `GET /ai/quotas/me` because it returns a different shape (per-feature daily remaining).

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap (`code === 200`), and error mapping. AI endpoints return the same envelope and need no special handling.

### 2. Group clients in `src/modules/api/rest/ai/`
**Rationale:** Mirrors the backend package `vn.ftes.aos.ai.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip SSE send and message history
**Rationale:** The content-AI chat UX is built on Socket.IO streaming (`content_ai.chunk.subscription`) and GraphQL `askContentAi`. Re-implementing the SSE endpoint would add a second streaming path and risk inconsistent behavior.

### 4. Types inferred from controller records
**Rationale:** The backend controllers define request/response records inline or in `AiInsightService`. We mirror them with TypeScript interfaces, using `string` for UUIDs and ISO timestamps, and `unknown` for flexible objects such as `contextRef`.

## Risks / Trade-offs

- **[Risk]** Several endpoints return `ApiResponse.of(1002, "Accepted", ...)` on creation. The shared `restRequest` treats `code === 200` as success, so `1002` will throw. Callers must be aware that job creation returns a non-200 success code. To handle this cleanly, the AI client may need to bypass `restRequest` or the wrapper may need a flag. **Mitigation:** For this change we document the behavior; if needed, a follow-up change can extend `restRequest` with an `acceptCodes` option.
- **[Risk]** `AdminController` endpoints require `ai.admin.manage`; callers must ensure admin UIs hold the permission.
- **[Risk]** `AiFeature` values are free-form strings in responses; the client does not validate them.
- **[Trade-off]** `GET /ai/quotas/me` overlaps conceptually with GraphQL `myAiQuota` but returns a different shape, so both are kept available.

## Affected Files / Modules

- `src/modules/api/rest/ai/types.ts`
- `src/modules/api/rest/ai/ai.ts`
- `src/modules/api/rest/ai/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
