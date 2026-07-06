## Purpose

Provide a typed REST client and SWR hooks for the AI REST controllers (`SessionController`, `JobController`, `QuotaController`, `TranscriptController`, `AdminController`) for endpoints not already covered by GraphQL or WebSocket.

## API Surface

### `src/modules/api/rest/ai/types.ts`

```ts
export type AiFeature = string

export interface CreateSessionRequest {
    feature: AiFeature
    contextRef?: unknown
}

export interface AiSessionView {
    id: string
    feature: AiFeature
    title?: string
    status: string
    messageCount: number
    remainingLessonChats?: number
}

export interface AiSendMessageRequest {
    content: string
}

export interface MessageView {
    id: string
    role: string
    content?: string
    tokenOutput?: number
    modelUsed?: string
}

export interface JobRef {
    jobId: string
    status: string
}

export interface JobView {
    id: string
    feature: AiFeature
    status: string
    result?: string
    errorCode?: string
    errorMessage?: string
}

export interface CareerSuggestionView {
    suggestion: string
}

export interface TranscriptRef {
    jobId: string
    status: string
    result?: string
}

export interface ModelConfigView {
    feature: AiFeature
    providerKey?: string
    modelName?: string
    fallbackProviderKey?: string
    fallbackModelName?: string
    active: boolean
}

export interface UpdateModelConfigRequest {
    providerKey?: string
    modelName?: string
    fallbackProviderKey?: string
    fallbackModelName?: string
    params?: string
}

export interface FeatureInsight {
    feature: AiFeature
    requests: number
    failed: number
    errorRate: number
    tokenInput: number
    tokenOutput: number
    estimatedCostUsd: number
}

export interface AiInsights {
    windowDays: number
    perFeature: FeatureInsight[]
    totalTokens: number
    estimatedCostUsd: number
}
```

### `src/modules/api/rest/ai/ai.ts`

Implemented REST functions:

```ts
// SessionController
export const createSession = (request: CreateSessionRequest): Promise<AiSessionView>
export const getSessions = (params?: { feature?: string; page?: number; size?: number }): Promise<AiSessionView[]>
export const getSession = (id: string): Promise<AiSessionView>
export const archiveSession = (id: string): Promise<void>

// JobController
export const submitSummaryJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitFlashcardsJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitQuizJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitOcrJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitCodeReviewJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitCvReviewJob = (body: Record<string, unknown>): Promise<JobRef>
export const getCareerSuggestion = (body?: Record<string, unknown>): Promise<CareerSuggestionView>
export const submitExamGenerateJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitGradeJob = (body: Record<string, unknown>): Promise<JobRef>
export const submitDifficultyJob = (body: Record<string, unknown>): Promise<JobRef>
export const getJob = (id: string): Promise<JobView>

// QuotaController
export const getMyAiQuota = (): Promise<Record<string, number>>

// TranscriptController
export const requestTranscript = (body: Record<string, unknown>): Promise<TranscriptRef>
export const getTranscript = (lessonId: string): Promise<TranscriptRef>

// AdminController
export const listModelConfigs = (): Promise<ModelConfigView[]>
export const updateModelConfig = (feature: string, request: UpdateModelConfigRequest): Promise<ModelConfigView>
export const getAiInsights = (days?: number): Promise<AiInsights>
```

Notes:
- Job submission endpoints return HTTP 200 with envelope `code=1002` (Accepted). The shared `restRequest` currently only treats `code=200` as success, so these calls will surface as errors until the REST client wrapper supports additional success codes.
- `GET /ai/jobs/{id}` may return envelope `code=4004` for not-found; `restRequest` will throw in that case.

Skipped functions (already covered):
- `POST /ai/sessions/{id}/messages` (SSE streaming) → use Socket.IO `askContentAi` / `content_ai.chunk.subscription`.
- `GET /ai/sessions/{id}/messages` → use GraphQL `contentAiHistory`.

### SWR Hooks

| Hook | File | Type | Key |
|------|------|------|-----|
| `useGetAiSessionsSwr` | `src/hooks/swr/api/rest/queries/useGetAiSessionsSwr.ts` | query | `["GET_AI_SESSIONS_SWR", params]` |
| `useGetAiSessionSwr` | `src/hooks/swr/api/rest/queries/useGetAiSessionSwr.ts` | query | `["GET_AI_SESSION_SWR", id]` |
| `useGetAiJobSwr` | `src/hooks/swr/api/rest/queries/useGetAiJobSwr.ts` | query | `["GET_AI_JOB_SWR", id]` |
| `useGetMyAiQuotaSwr` | `src/hooks/swr/api/rest/queries/useGetMyAiQuotaSwr.ts` | query | `["GET_MY_AI_QUOTA_SWR"]` |
| `useGetTranscriptSwr` | `src/hooks/swr/api/rest/queries/useGetTranscriptSwr.ts` | query | `["GET_TRANSCRIPT_SWR", lessonId]` |
| `useGetModelConfigsSwr` | `src/hooks/swr/api/rest/queries/useGetModelConfigsSwr.ts` | query | `["GET_MODEL_CONFIGS_SWR"]` |
| `useGetAiInsightsSwr` | `src/hooks/swr/api/rest/queries/useGetAiInsightsSwr.ts` | query | `["GET_AI_INSIGHTS_SWR", days]` |
| `usePostCreateAiSessionSwr` | `src/hooks/swr/api/rest/mutations/usePostCreateAiSessionSwr.ts` | mutation | `"POST_CREATE_AI_SESSION_SWR"` |
| `usePostArchiveAiSessionSwr` | `src/hooks/swr/api/rest/mutations/usePostArchiveAiSessionSwr.ts` | mutation | `"POST_ARCHIVE_AI_SESSION_SWR"` |
| `usePostSummaryJobSwr` | `src/hooks/swr/api/rest/mutations/usePostSummaryJobSwr.ts` | mutation | `"POST_SUMMARY_JOB_SWR"` |
| `usePostFlashcardsJobSwr` | `src/hooks/swr/api/rest/mutations/usePostFlashcardsJobSwr.ts` | mutation | `"POST_FLASHCARDS_JOB_SWR"` |
| `usePostQuizJobSwr` | `src/hooks/swr/api/rest/mutations/usePostQuizJobSwr.ts` | mutation | `"POST_QUIZ_JOB_SWR"` |
| `usePostOcrJobSwr` | `src/hooks/swr/api/rest/mutations/usePostOcrJobSwr.ts` | mutation | `"POST_OCR_JOB_SWR"` |
| `usePostCodeReviewJobSwr` | `src/hooks/swr/api/rest/mutations/usePostCodeReviewJobSwr.ts` | mutation | `"POST_CODE_REVIEW_JOB_SWR"` |
| `usePostCvReviewJobSwr` | `src/hooks/swr/api/rest/mutations/usePostCvReviewJobSwr.ts` | mutation | `"POST_CV_REVIEW_JOB_SWR"` |
| `usePostCareerSuggestionSwr` | `src/hooks/swr/api/rest/mutations/usePostCareerSuggestionSwr.ts` | mutation | `"POST_CAREER_SUGGESTION_SWR"` |
| `usePostExamGenerateJobSwr` | `src/hooks/swr/api/rest/mutations/usePostExamGenerateJobSwr.ts` | mutation | `"POST_EXAM_GENERATE_JOB_SWR"` |
| `usePostGradeJobSwr` | `src/hooks/swr/api/rest/mutations/usePostGradeJobSwr.ts` | mutation | `"POST_GRADE_JOB_SWR"` |
| `usePostDifficultyJobSwr` | `src/hooks/swr/api/rest/mutations/usePostDifficultyJobSwr.ts` | mutation | `"POST_DIFFICULTY_JOB_SWR"` |
| `usePostRequestTranscriptSwr` | `src/hooks/swr/api/rest/mutations/usePostRequestTranscriptSwr.ts` | mutation | `"POST_REQUEST_TRANSCRIPT_SWR"` |
| `usePostUpdateModelConfigSwr` | `src/hooks/swr/api/rest/mutations/usePostUpdateModelConfigSwr.ts` | mutation | `"POST_UPDATE_MODEL_CONFIG_SWR"` |

## Acceptance Criteria

1. `src/modules/api/rest/ai/ai.ts` exports typed functions for all non-overlapping AI controller endpoints.
2. `src/modules/api/rest/ai/types.ts` mirrors the backend DTO shapes.
3. `src/modules/api/rest/index.ts` re-exports `./ai`.
4. Query and mutation SWR hooks exist and correctly call the clients.
5. `npx tsc --noEmit` exits cleanly.
6. `npm run build -- --webpack` exits cleanly.

## Out of Scope

- UI components/pages using AI.
- Replacing GraphQL `contentAiSessions`, `contentAiHistory`, `myAiQuota`, `askContentAi`.
- Replacing Socket.IO content-AI streaming.
- Backend controller changes.
- New npm dependencies.
