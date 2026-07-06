## Why

The shared REST client is being rolled out domain by domain. The chat backend exposes a full `ChatController` (`/api/v1/chat`) for conversation and message lifecycle operations, but the frontend currently only has GraphQL coverage for the community/founder DM message stream and Socket.IO/STOMP coverage for real-time send/typing/read. We need typed REST clients and SWR hooks for the chat REST endpoints that are not already covered by GraphQL or WebSocket.

## What Changes

- Add a typed REST module `src/modules/api/rest/chat/` exposing the `ChatController` contract.
- Add SWR query hooks for chat reads that GraphQL/socket do not cover (conversation list/detail, pins, message search, presence batch).
- Add SWR mutation hooks for chat writes that GraphQL/socket do not cover (create conversation, participant management, edit/recall message, reactions, pin/unpin).
- Skip REST endpoints that overlap with existing GraphQL/socket flows (message listing/send via GraphQL, read/typing via STOMP) and document the rationale in `design.md`.
- Export the chat module from `src/modules/api/rest/index.ts`.

## Capabilities

### New Capabilities
- `rest-fetch-chat`: Typed REST client + SWR hooks for `ChatController` endpoints not already provided by GraphQL or WebSocket.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/chat/` and `src/hooks/swr/api/rest/{queries,mutations}/`.
- One-line barrel update in `src/modules/api/rest/index.ts`.
- No backend changes, no new dependencies, no changes to existing GraphQL/socket code.
