## 1. Scaffold REST client module

- [x] 1.1 Create `src/modules/api/rest/chat/types.ts` with DTOs for `CreateConversationRequest`, `ConversationResponse`, `Page`, `AttachmentInput`, `SendMessageRequest`, `EditMessageRequest`, `ChatMessageResponse`, `ReadRequest`, `AddParticipantRequest`, and `PresenceResponse`.
- [x] 1.2 Create `src/modules/api/rest/chat/chat.ts` implementing all non-overlapping `ChatController` endpoints via `restRequest`.
- [x] 1.3 Create `src/modules/api/rest/chat/index.ts` barrel file.

## 2. Update REST barrel

- [x] 2.1 Add `export * from "./chat"` to `src/modules/api/rest/index.ts`.

## 3. Add SWR query hooks

- [x] 3.1 Create `src/hooks/swr/api/rest/queries/useGetConversationsSwr.ts`.
- [x] 3.2 Create `src/hooks/swr/api/rest/queries/useGetConversationSwr.ts`.
- [x] 3.3 Create `src/hooks/swr/api/rest/queries/useGetPinnedMessagesSwr.ts`.
- [x] 3.4 Create `src/hooks/swr/api/rest/queries/useSearchMessagesSwr.ts`.
- [x] 3.5 Create `src/hooks/swr/api/rest/queries/useGetPresenceSwr.ts`.
- [x] 3.6 Update `src/hooks/swr/api/rest/queries/index.ts` barrel.

## 4. Add SWR mutation hooks

- [x] 4.1 Create `src/hooks/swr/api/rest/mutations/usePostCreateConversationSwr.ts`.
- [x] 4.2 Create `src/hooks/swr/api/rest/mutations/usePostAddParticipantSwr.ts`.
- [x] 4.3 Create `src/hooks/swr/api/rest/mutations/usePostRemoveParticipantSwr.ts`.
- [x] 4.4 Create `src/hooks/swr/api/rest/mutations/usePostEditMessageSwr.ts`.
- [x] 4.5 Create `src/hooks/swr/api/rest/mutations/usePostRecallMessageSwr.ts`.
- [x] 4.6 Create `src/hooks/swr/api/rest/mutations/usePostReactToMessageSwr.ts`.
- [x] 4.7 Create `src/hooks/swr/api/rest/mutations/usePostUnreactToMessageSwr.ts`.
- [x] 4.8 Create `src/hooks/swr/api/rest/mutations/usePostPinMessageSwr.ts`.
- [x] 4.9 Create `src/hooks/swr/api/rest/mutations/usePostUnpinMessageSwr.ts`.
- [x] 4.10 Update `src/hooks/swr/api/rest/mutations/index.ts` barrel.

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit` and fix any type errors.
- [x] 5.2 Run `npm run build -- --webpack` and fix any build errors.
