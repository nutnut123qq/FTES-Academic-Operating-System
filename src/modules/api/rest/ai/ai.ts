import { restRequest } from "@/modules/api/rest/client"
import { publicEnv } from "@/resources/env/public"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type {
    AiBulkArchiveResult,
    AiInsights,
    AiModelCatalog,
    CareerSuggestionView,
    CodeExecuteResult,
    CodeExecutionSummary,
    CodeGradeResult,
    CreateSessionRequest,
    CreateStudyPlanRequest,
    DocumentQaRequest,
    DocumentQaResponse,
    ExecuteCodeRequest,
    GradeCodeRequest,
    RunTestsRequest,
    JobRef,
    JobView,
    ModelConfigView,
    AiSessionView,
    SqlExecuteRequest,
    SqlRunResult,
    SqlSchema,
    SqlSchemaRequest,
    StudyPlanProgressRequest,
    StudyPlanView,
    TranscriptRef,
    UpdateModelConfigRequest,
} from "./types"

// ---------------- SessionController ----------------

export const createSession = async (request: CreateSessionRequest): Promise<AiSessionView> =>
    restRequest<AiSessionView>({
        method: "POST",
        url: "/ai/sessions",
        data: request,
    })

/** Callbacks for the SSE stream of {@link sendSessionMessageStream}. */
export interface SessionStreamHandlers {
    /** Fired for each streamed chunk of the assistant answer. */
    onDelta: (text: string) => void
    /** Fired once when the stream completes successfully (payload = {messageId, usage}). */
    onDone?: (data: unknown) => void
    /** Fired on a generation/error event (code) or a non-2xx response. */
    onError?: (code: string) => void
    /** Fired when the request is rejected by a quota/lesson-limit gate. */
    onQuota?: (data: unknown) => void
    /** Abort the in-flight stream (BE releases its Redis lock on client disconnect). */
    signal?: AbortSignal
}

/**
 * Boundary between two SSE events: a blank line. Spring's `SseEmitter` writes `\n\n`, but the SSE
 * spec allows CRLF and a proxy in between may rewrite it — so accept both. Keep this set identical
 * to what {@link sendSessionMessageStream}'s per-line parser tolerates (`\n`, optional leading `\r`);
 * widening one side without the other is exactly the bug this replaced.
 */
const SSE_BLOCK_SEPARATOR = /\r?\n\r?\n/

const safeJson = (raw: string): unknown => {
    try {
        return JSON.parse(raw)
    } catch {
        return raw
    }
}

/**
 * Streams a message into an AI chat session over SSE
 * (`POST /api/v1/ai/sessions/{id}/messages`, `text/event-stream`). The BE emits named events —
 * `delta` (answer chunk), `done` ({messageId, usage}), `error` ({code}), `quota` (gate hit).
 *
 * Uses `fetch` + a `ReadableStream` reader (NOT `EventSource`, which cannot POST or send an
 * `Authorization` header). The bearer token is read from local storage.
 *
 * @param model - Optional catalog model id; omitted from the body → BE answers with `defaults.chat`.
 */
export const sendSessionMessageStream = async (
    sessionId: string,
    content: string,
    handlers: SessionStreamHandlers,
    model?: string,
): Promise<void> => {
    const token = LocalStorage.getItemAsString(LocalStorageId.KeycloakAccessToken) ?? ""
    const response = await fetch(
        `${publicEnv().api.http.replace(/\/$/, "")}/ai/sessions/${sessionId}/messages`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content, ...(model ? { model } : {}) }),
            signal: handlers.signal,
        },
    )
    if (!response.ok || !response.body) {
        handlers.onError?.(`HTTP_${response.status}`)
        return
    }

    // Parse one SSE event block: an `event:` name + one/more `data:` lines (joined with newlines).
    // Trailing `\r` is stripped per line: on a CRLF stream the `event:` branch would survive via
    // `.trim()`, but `data:` keeps whatever follows the colon — so without this every delta fragment
    // would carry a stray `\r` and concatenate into garbage.
    const dispatch = (block: string) => {
        let name = "message"
        const dataLines: Array<string> = []
        for (const rawLine of block.split("\n")) {
            const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine
            if (line.startsWith("event:")) name = line.slice(6).trim()
            else if (line.startsWith("data:")) dataLines.push(line.slice(5))
        }
        const data = dataLines.join("\n")
        if (name === "delta") handlers.onDelta(data)
        else if (name === "done") handlers.onDone?.(safeJson(data))
        else if (name === "error") handlers.onError?.(String((safeJson(data) as { code?: unknown })?.code ?? data))
        else if (name === "quota") handlers.onQuota?.(safeJson(data))
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // Events are separated by a blank line — LF *or* CRLF. `"\r\n\r\n"` holds no two adjacent
        // `\n`, so the old `indexOf("\n\n")` missed every boundary: the whole stream piled up in the
        // buffer and the trailing `dispatch(buffer)` parsed it as ONE block, keeping only the last
        // `event:` and losing every delta. Boundary length varies 2↔4, so advance by the match.
        let sep = SSE_BLOCK_SEPARATOR.exec(buffer)
        while (sep !== null) {
            const block = buffer.slice(0, sep.index)
            buffer = buffer.slice(sep.index + sep[0].length)
            if (block.trim()) dispatch(block)
            sep = SSE_BLOCK_SEPARATOR.exec(buffer)
        }
    }
    if (buffer.trim()) dispatch(buffer)
}

export const getSessions = async (params?: {
    feature?: string
    page?: number
    size?: number
}): Promise<AiSessionView[]> =>
    restRequest<AiSessionView[]>({
        method: "GET",
        url: "/ai/sessions",
        params: { ...params },
        authenticated: true,
    })

/**
 * Lists the caller's own sessions, newest first, with the server-side filters
 * (`change ai-session-context-filter`):
 *
 * - `subjectId` / `lessonId` / `questionSetId` match the flat `context_ref` the client
 *   declared when the session was created — this is what makes a list SUBJECT-SCOPED
 *   instead of "every conversation of this user";
 * - `status` (`ACTIVE` | `ARCHIVED`) keeps archived rows out server-side; an unknown value
 *   is a `400 AI_SESSION_STATUS_INVALID` rather than a silent empty page.
 *
 * Every row carries its `contextRef` back, so a session can be attributed without an
 * extra request. Passing no filter reproduces the old behaviour (all sessions).
 *
 * `GET /api/v1/ai/sessions`
 */
export const listAiSessions = async (params?: {
    feature?: string
    status?: string
    subjectId?: string
    lessonId?: string
    questionSetId?: string
    page?: number
    size?: number
}): Promise<AiSessionView[]> =>
    restRequest<AiSessionView[]>({
        method: "GET",
        url: "/ai/sessions",
        params: { ...params },
        authenticated: true,
    })

/**
 * Bulk-archives the caller's sessions matching the filter — ONE request instead of a
 * `DELETE /ai/sessions/{id}` loop — and answers `{archived}`, the number of rows that
 * actually changed state (so a second call returns `0`: idempotent).
 *
 * Same filter vocabulary as {@link listAiSessions}. Passing NOTHING archives every
 * non-archived session of the caller, so a scoped "clear" must always send its
 * `subjectId`. The BE always constrains by user id — another user's rows are unreachable.
 *
 * `DELETE /api/v1/ai/sessions`
 */
export const deleteAiSessions = async (params?: {
    feature?: string
    subjectId?: string
    lessonId?: string
    questionSetId?: string
}): Promise<AiBulkArchiveResult> =>
    restRequest<AiBulkArchiveResult>({
        method: "DELETE",
        url: "/ai/sessions",
        params: { ...params },
    })

export const getSession = async (id: string): Promise<AiSessionView> =>
    restRequest<AiSessionView>({
        method: "GET",
        url: `/ai/sessions/${id}`,
        authenticated: true,
    })

export const archiveSession = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/ai/sessions/${id}`,
    })

// ---------------- JobController ----------------

const submitJob = async (url: string, body: Record<string, unknown>): Promise<JobRef> =>
    restRequest<JobRef>({
        method: "POST",
        url,
        data: body,
    })

export const submitSummaryJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/learning/summary", body)

export const submitFlashcardsJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/learning/flashcards", body)

export const submitQuizJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/learning/quiz", body)

export const submitOcrJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/learning/ocr", body)

export const submitCodeReviewJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/coding/review", body)

export const submitCvReviewJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/career/cv-review", body)

export const getCareerSuggestion = async (
    body?: Record<string, unknown>,
): Promise<CareerSuggestionView> =>
    restRequest<CareerSuggestionView>({
        method: "POST",
        url: "/ai/career/suggestion",
        data: body,
    })

export const submitExamGenerateJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/teacher/exam-generate", body)

export const submitGradeJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/teacher/grade", body)

export const submitDifficultyJob = async (body: Record<string, unknown>): Promise<JobRef> =>
    submitJob("/ai/teacher/difficulty", body)

export const getJob = async (id: string): Promise<JobView> =>
    restRequest<JobView>({
        method: "GET",
        url: `/ai/jobs/${id}`,
        authenticated: true,
    })

// ---------------- StudyPlanController ----------------

/**
 * Plan generation is synchronous BE-side (calls ftes-ai-service and blocks until the
 * plan is generated, ~20–40s) → a long axios timeout so the FE does not abort a slow
 * generation before the plan returns.
 */
const STUDY_PLAN_TIMEOUT_MS = 120_000

/**
 * Generates a personalized study plan and returns the full saved plan.
 *
 * `POST /api/v1/ai/learning/study-plan` — permission `ai.learning.use` (STUDENT+).
 * Synchronous + long-running; spends the `STUDY_PLANNER` quota (refunded on provider
 * failure). Over quota → 429; bad input → 400 `STUDY_PLAN_INPUT_INVALID`.
 */
export const createStudyPlan = async (body: CreateStudyPlanRequest): Promise<StudyPlanView> =>
    restRequest<StudyPlanView>({
        method: "POST",
        url: "/ai/learning/study-plan",
        data: body,
        authenticated: true,
        timeout: STUDY_PLAN_TIMEOUT_MS,
    })

/** Lists the caller's ACTIVE study plans (owner-scoped, newest first). */
export const getStudyPlans = async (params?: {
    page?: number
    size?: number
}): Promise<StudyPlanView[]> =>
    restRequest<StudyPlanView[]>({
        method: "GET",
        url: "/ai/learning/study-plans",
        params: { ...params },
        authenticated: true,
    })

/** One study plan by id (owner-only, incl. ARCHIVED); unknown → 404 `STUDY_PLAN_NOT_FOUND`. */
export const getStudyPlan = async (id: string): Promise<StudyPlanView> =>
    restRequest<StudyPlanView>({
        method: "GET",
        url: `/ai/learning/study-plans/${id}`,
        authenticated: true,
    })

/**
 * Checks-off / un-checks one task and returns the plan with a recomputed
 * `percentDone`. `PATCH /api/v1/ai/learning/study-plans/{id}/progress` — idempotent;
 * an unknown `taskKey` → 400 `STUDY_PLAN_INPUT_INVALID`.
 */
export const patchStudyPlanProgress = async (
    id: string,
    body: StudyPlanProgressRequest,
): Promise<StudyPlanView> =>
    restRequest<StudyPlanView>({
        method: "PATCH",
        url: `/ai/learning/study-plans/${id}/progress`,
        data: body,
        authenticated: true,
    })

/** Soft-archives a plan (status → ARCHIVED) and returns the archived view. Owner-only (404). */
export const archiveStudyPlan = async (id: string): Promise<StudyPlanView> =>
    restRequest<StudyPlanView>({
        method: "DELETE",
        url: `/ai/learning/study-plans/${id}`,
        authenticated: true,
    })

// ---------------- QuotaController ----------------

export const getMyAiQuota = async (): Promise<Record<string, number>> =>
    restRequest<Record<string, number>>({
        method: "GET",
        url: "/ai/quotas/me",
        authenticated: true,
    })

// ---------------- TranscriptController ----------------

export const requestTranscript = async (
    body: Record<string, unknown>,
): Promise<TranscriptRef> =>
    restRequest<TranscriptRef>({
        method: "POST",
        url: "/ai/learning/transcript",
        data: body,
    })

export const getTranscript = async (lessonId: string): Promise<TranscriptRef> =>
    restRequest<TranscriptRef>({
        method: "GET",
        url: `/ai/learning/transcript/${lessonId}`,
        authenticated: true,
    })

// ---------------- DocumentQaController ----------------

/**
 * Synchronous BE-side (RAG hop to ftes-ai-service) → long axios timeout so a slow
 * retrieval/answer is not aborted client-side.
 */
const DOCUMENT_QA_TIMEOUT_MS = 120_000

/**
 * Asks a question about a document/lesson ("hỏi đáp tài liệu" + selection-anchored ask).
 *
 * `POST /api/v1/ai/document-qa` — permission `ai.learning.use` (STUDENT+). Send
 * `documentId` and/or `lessonId` (BE resolves `document_ref = documentId ?? lessonId`).
 * Quota-gated (2 layers, refunded on provider failure / not-yet-indexed). A document
 * still being indexed answers softly with `{answer: "", processing: true}` — treat it
 * as "Đang xử lý tài liệu…", not an error.
 */
export const askDocumentQa = async (body: DocumentQaRequest): Promise<DocumentQaResponse> =>
    restRequest<DocumentQaResponse>({
        method: "POST",
        url: "/ai/document-qa",
        data: body,
        authenticated: true,
        timeout: DOCUMENT_QA_TIMEOUT_MS,
    })

// ---------------- ModelsController ----------------

/**
 * Lists the AI model catalog for model pickers (chat / code grading / …).
 *
 * `GET /api/v1/ai/models` — authenticated (any signed-in role).
 */
export const listAiCatalogModels = async (): Promise<AiModelCatalog> =>
    restRequest<AiModelCatalog>({
        method: "GET",
        url: "/ai/models",
        authenticated: true,
    })

// ---------------- CodeGradeController ----------------

/**
 * Grading is synchronous BE-side (Judge0 + LLM, 10–60s; BE read-timeout 180s)
 * → long axios timeout so the FE does not abort a slow grade.
 */
const CODE_GRADE_TIMEOUT_MS = 180_000

/**
 * Grades code with AI (Judge0 test cases + LLM criteria, model selectable).
 *
 * `POST /api/v1/ai/coding/grade-code` — permission `ai.coding.use` (STUDENT+).
 */
export const gradeCode = async (body: GradeCodeRequest): Promise<CodeGradeResult> =>
    restRequest<CodeGradeResult>({
        method: "POST",
        url: "/ai/coding/grade-code",
        data: body,
        authenticated: true,
        timeout: CODE_GRADE_TIMEOUT_MS,
    })

/**
 * The code sandbox runs one program (no LLM), capped BE-side by a short run limit.
 * A dedicated, much shorter client timeout than the grade path (which waits on the LLM)
 * so a hung Piston/network on a plain Run surfaces in seconds instead of leaving the
 * panel spinning for minutes. Mirrors {@link SQL_EXECUTE_TIMEOUT_MS}.
 */
const CODE_EXECUTE_TIMEOUT_MS = 30_000

/**
 * Runs code in the in-browser sandbox (PIN §7.1) — no LLM, no AI quota spent. Returns
 * the program's streams (`stdout`/`stderr`/`exit_code`/`time_ms`/`compile_output`).
 *
 * `POST /api/v1/ai/coding/execute-code` — permission `ai.coding.use` (STUDENT+). Engine
 * unconfigured BE-side → 503 `AI_EXEC_UNAVAILABLE` (the panel shows a graceful message).
 */
export const executeCode = async (body: ExecuteCodeRequest): Promise<CodeExecuteResult> =>
    restRequest<CodeExecuteResult>({
        method: "POST",
        url: "/ai/coding/execute-code",
        data: body,
        authenticated: true,
        timeout: CODE_EXECUTE_TIMEOUT_MS,
    })

/**
 * Runs the learner's code against a challenge's SAMPLE (non-hidden) test cases in the
 * sandbox — no LLM, no AI quota spent (mirrors {@link executeCode}). Returns the per-case
 * execution block ({@link CodeExecutionSummary}: `results[]` + `passed`/`total`). HIDDEN
 * test cases are NEVER sent here — they stay server-side for AI grading.
 *
 * `POST /api/v1/ai/coding/run-tests` — permission `ai.coding.use` (STUDENT+). Engine
 * unconfigured BE-side → 503 `AI_EXEC_UNAVAILABLE` (the panel shows a graceful message);
 * for SQL exercises the equivalent is `AI_SQL_UNAVAILABLE` (a separate sandbox).
 *
 * SQL exercises run each case on the SQL sandbox instead of the code engine — pass the
 * challenge's `setupSql` or the query runs against an empty database.
 */
export const runTests = async (body: RunTestsRequest): Promise<CodeExecutionSummary> =>
    restRequest<CodeExecutionSummary>({
        method: "POST",
        url: "/ai/coding/run-tests",
        data: body,
        authenticated: true,
        timeout: CODE_EXECUTE_TIMEOUT_MS,
    })

/**
 * The SQL sandbox runs one statement in a rolled-back tx, capped BE-side by a short
 * `statement_timeout` (~4s). A dedicated, much shorter client timeout than the grade
 * path (which waits on the LLM) so a hung engine/network surfaces in seconds instead of
 * leaving the panel spinning for minutes.
 */
const SQL_EXECUTE_TIMEOUT_MS = 30_000

/**
 * Runs a SQL query against the Postgres sandbox (single rolled-back tx — no LLM, no quota).
 *
 * `POST /api/v1/ai/coding/execute-sql` — permission `ai.coding.use` (STUDENT+). Engine
 * unconfigured BE-side → 503 `AI_SQL_UNAVAILABLE` (the panel shows a graceful message).
 */
export const executeSql = async (body: SqlExecuteRequest): Promise<SqlRunResult> =>
    restRequest<SqlRunResult>({
        method: "POST",
        url: "/ai/coding/execute-sql",
        data: body,
        authenticated: true,
        timeout: SQL_EXECUTE_TIMEOUT_MS,
    })

/**
 * Introspects the schema of a SQL challenge's seed dataset (PIN §4C) — the BE runs the
 * seed in a rolled-back tx and reads `information_schema` to return the tables / columns /
 * foreign keys the learner can query. No LLM, no quota. Reuses the short SQL sandbox
 * timeout so a hung engine surfaces fast.
 *
 * `POST /api/v1/ai/coding/sql-schema` — permission `ai.coding.use` (STUDENT+). Engine
 * unconfigured BE-side → 503 `AI_SQL_UNAVAILABLE` (the panel shows a graceful message).
 */
export const sqlSchema = async (body: SqlSchemaRequest): Promise<SqlSchema> =>
    restRequest<SqlSchema>({
        method: "POST",
        url: "/ai/coding/sql-schema",
        data: body,
        authenticated: true,
        timeout: SQL_EXECUTE_TIMEOUT_MS,
    })

// ---------------- AdminController ----------------

export const listModelConfigs = async (): Promise<ModelConfigView[]> =>
    restRequest<ModelConfigView[]>({
        method: "GET",
        url: "/ai/admin/model-configs",
        authenticated: true,
    })

export const updateModelConfig = async (
    feature: string,
    request: UpdateModelConfigRequest,
): Promise<ModelConfigView> =>
    restRequest<ModelConfigView>({
        method: "PUT",
        url: `/ai/admin/model-configs/${feature}`,
        data: request,
    })

export const getAiInsights = async (days?: number): Promise<AiInsights> =>
    restRequest<AiInsights>({
        method: "GET",
        url: "/ai/admin/insights",
        params: { days },
        authenticated: true,
    })
