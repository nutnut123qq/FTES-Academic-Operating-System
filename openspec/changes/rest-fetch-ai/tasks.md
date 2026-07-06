## 1. Scaffold REST client module

- [x] 1.1 Create `src/modules/api/rest/ai/types.ts` with DTOs for `CreateSessionRequest`, `SessionView`, `MessageView`, `JobRef`, `JobView`, `CareerSuggestionView`, `TranscriptRef`, `ModelConfigView`, `UpdateModelConfigRequest`, `FeatureInsight`, and `AiInsights`.
- [x] 1.2 Create `src/modules/api/rest/ai/ai.ts` implementing all non-overlapping AI controller endpoints via `restRequest`.
- [x] 1.3 Create `src/modules/api/rest/ai/index.ts` barrel file.

## 2. Update REST barrel

- [x] 2.1 Add `export * from "./ai"` to `src/modules/api/rest/index.ts`.

## 3. Add SWR query hooks

- [x] 3.1 Create `src/hooks/swr/api/rest/queries/useGetAiSessionsSwr.ts`.
- [x] 3.2 Create `src/hooks/swr/api/rest/queries/useGetAiSessionSwr.ts`.
- [x] 3.3 Create `src/hooks/swr/api/rest/queries/useGetAiJobSwr.ts`.
- [x] 3.4 Create `src/hooks/swr/api/rest/queries/useGetMyAiQuotaSwr.ts`.
- [x] 3.5 Create `src/hooks/swr/api/rest/queries/useGetTranscriptSwr.ts`.
- [x] 3.6 Create `src/hooks/swr/api/rest/queries/useGetModelConfigsSwr.ts`.
- [x] 3.7 Create `src/hooks/swr/api/rest/queries/useGetAiInsightsSwr.ts`.
- [x] 3.8 Update `src/hooks/swr/api/rest/queries/index.ts` barrel.

## 4. Add SWR mutation hooks

- [x] 4.1 Create `src/hooks/swr/api/rest/mutations/usePostCreateAiSessionSwr.ts`.
- [x] 4.2 Create `src/hooks/swr/api/rest/mutations/usePostArchiveAiSessionSwr.ts`.
- [x] 4.3 Create `src/hooks/swr/api/rest/mutations/usePostSummaryJobSwr.ts`.
- [x] 4.4 Create `src/hooks/swr/api/rest/mutations/usePostFlashcardsJobSwr.ts`.
- [x] 4.5 Create `src/hooks/swr/api/rest/mutations/usePostQuizJobSwr.ts`.
- [x] 4.6 Create `src/hooks/swr/api/rest/mutations/usePostOcrJobSwr.ts`.
- [x] 4.7 Create `src/hooks/swr/api/rest/mutations/usePostCodeReviewJobSwr.ts`.
- [x] 4.8 Create `src/hooks/swr/api/rest/mutations/usePostCvReviewJobSwr.ts`.
- [x] 4.9 Create `src/hooks/swr/api/rest/mutations/usePostCareerSuggestionSwr.ts`.
- [x] 4.10 Create `src/hooks/swr/api/rest/mutations/usePostExamGenerateJobSwr.ts`.
- [x] 4.11 Create `src/hooks/swr/api/rest/mutations/usePostGradeJobSwr.ts`.
- [x] 4.12 Create `src/hooks/swr/api/rest/mutations/usePostDifficultyJobSwr.ts`.
- [x] 4.13 Create `src/hooks/swr/api/rest/mutations/usePostRequestTranscriptSwr.ts`.
- [x] 4.14 Create `src/hooks/swr/api/rest/mutations/usePostUpdateModelConfigSwr.ts`.
- [x] 4.15 Update `src/hooks/swr/api/rest/mutations/index.ts` barrel.

## 5. Verify

- [x] 5.1 Run `npx tsc --noEmit` and fix any type errors.
- [x] 5.2 Run `npm run build -- --webpack` and fix any build errors.
