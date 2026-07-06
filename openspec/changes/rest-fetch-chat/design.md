## Context

The shared REST client (`restRequest`) powers multiple domains. The chat backend (`vn.ftes.aos.chat.web.ChatController`) exposes a full REST API at `/api/v1/chat` for conversation and message lifecycle. The frontend already covers some chat flows through GraphQL (`chatMessages`, `myFounderConversation`, `communityChatConversation`, `sendChatMessage`) and Socket.IO/STOMP (`/app/chat.send`, `/app/chat.read`, `/app/chat.typing`). This change adds typed REST clients and SWR hooks only for the chat endpoints that are not already provided by those existing channels.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/chat/` for all non-overlapping `ChatController` endpoints.
- Add SWR query hooks for read operations not covered by GraphQL/socket (conversation list/detail, pins, message search, presence).
- Add SWR mutation hooks for write operations not covered by GraphQL/socket (conversation CRUD, participant management, edit/recall, reactions, pin/unpin).
- Update `src/modules/api/rest/index.ts` to re-export `./chat`.
- Pass `npx tsc --noEmit` and `npm run build -- --webpack`.

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not duplicate GraphQL/socket flows:
  - `GET /conversations/{id}/messages` and `POST /conversations/{id}/messages` are covered by `queryChatMessages` and `mutation-send-chat-message` GraphQL operations.
  - `PUT /conversations/{id}/read` overlaps with the STOMP `/app/chat.read` command.
  - Real-time send/typing is handled by Socket.IO/STOMP, not REST.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap (`code === 200`), and error mapping. Chat needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/chat/`
**Rationale:** Mirrors the backend package `vn.ftes.aos.chat.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip REST endpoints already covered by GraphQL or WebSocket
**Rationale:** The project already uses `queryChatMessages`, `mutateSendChatMessage`, and STOMP for real-time message flow. Re-exposing those through REST would create duplication and risk inconsistent UX. We document the skipped endpoints explicitly.

### 4. Types inferred from `ChatDtos.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps.

## Risks / Trade-offs

- **[Risk]** Presence batch request (`GET /presence`) accepts a comma-separated `userIds` string and scopes results to shared conversations server-side. Callers must not assume all requested IDs are returned.
- **[Risk]** The backend requires an authenticated user for every `/api/v1/chat/**` endpoint. All hooks must attach the bearer token; the shared client does this automatically for mutating methods, but GET calls must opt in with `authenticated: true`.
- **[Trade-off]** `GET /conversations/{id}/messages` is skipped because GraphQL already paginates messages. If a feature needs raw REST message fields (e.g., `replyToId`, `clientMessageId`, attachments), it can be added later as a separate delta.

## Affected Files / Modules

- `src/modules/api/rest/chat/types.ts`
- `src/modules/api/rest/chat/chat.ts`
- `src/modules/api/rest/chat/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
