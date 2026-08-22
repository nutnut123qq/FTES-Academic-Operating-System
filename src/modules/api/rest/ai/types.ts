/**
 * Request/response DTOs for the AI REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.ai.web.SessionController`,
 * `JobController`, `QuotaController`, `TranscriptController`, and `AdminController`.
 */

export type AiFeature = string

export interface CreateSessionRequest {
    feature: AiFeature
    contextRef?: unknown
    /** Model id from the catalog; omit → BE answers with `defaults.chat`. */
    model?: string
}

/**
 * The context a session was opened against, as the BE projects it back
 * (`AiSessionContextRef` — a safe subset of the stored `context_ref` jsonb).
 * `null`/absent when the session is not tied to anything.
 */
export interface AiSessionContextRef {
    subjectId?: string | null
    lessonId?: string | null
    questionSetId?: string | null
}

export interface AiSessionView {
    id: string
    feature: AiFeature
    title?: string
    status: string
    messageCount: number
    remainingLessonChats?: number
    /** Context the session belongs to — lets the FE attribute a row to a subject/lesson. */
    contextRef?: AiSessionContextRef | null
}

/** Result of the bulk archive (`DELETE /ai/sessions`) — how many rows actually flipped. */
export interface AiBulkArchiveResult {
    archived: number
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

// ---------------- ModelsController (GET /api/v1/ai/models) ----------------

/**
 * Static pricing hint from ftes-ai-service — an OBJECT (`{prompt_per_1k,
 * completion_per_1k, unit}`), NOT a display string. The BE proxies the catalog
 * verbatim, so never render this directly (an object as a React child throws);
 * derive a label via {@link isFreeModel} / helpers instead.
 */
export interface AiModelPricingHint {
    prompt_per_1k?: number
    completion_per_1k?: number
    unit?: string
}

/** One selectable model from the ftes-ai-service catalog. */
export interface AiCatalogModel {
    id: string
    label?: string
    provider?: string
    vision?: boolean
    default_for?: Array<string>
    pricing_hint?: AiModelPricingHint
    /**
     * True for OpenRouter free-tier models (quota-limited — may fall back). Sent
     * by newer ai-service builds; older ones omit it, so callers also derive it
     * from a `:free` id / zero pricing (see {@link isFreeModel}).
     */
    free?: boolean
    /** Coarse per-model health: "available" | "degraded" | "down". Optional. */
    status?: string
    /** Spend threshold (VND) to unlock this model; 0/absent → not spend-gated. Added by the BE. */
    minSpendVnd?: number
    /** BE per-user gate flag (gated AND not unlocked). Unreliable in some builds → also gate on minSpendVnd. */
    locked?: boolean
}

/**
 * Model catalog proxied verbatim from ftes-ai-service `GET /v2/models` —
 * `{models[], defaults{chat,…}}`. `defaults.chat` is the model the BE grades
 * with when the request carries no explicit `model`.
 */
export interface AiModelCatalog {
    models?: Array<AiCatalogModel>
    defaults?: Record<string, string>
    /**
     * True when the service falls back to a direct Gemini API key once the
     * OpenRouter models are exhausted. Optional (older ai-service omits it).
     */
    gemini_fallback?: boolean
}

// ---------------- CodeGradeController (POST /api/v1/ai/coding/*) ----------------

/** One test case sent to Judge0 (snake_case — ftes-ai-service contract). */
export interface CodeGradeTestCase {
    input: string
    output: string
}

/**
 * Body of `POST /api/v1/ai/coding/grade-code`. Field names are snake_case —
 * the BE passes the body through verbatim to ftes-ai-service `/v2/code/grade`.
 */
export interface GradeCodeRequest {
    exercise_question: string
    code: string
    language: string
    test_cases?: Array<CodeGradeTestCase>
    /** `false` on a re-grade with an unchanged code to skip Judge0 (execution is model-independent). */
    run_code_execution?: boolean
    /** Model id from the catalog; omit → BE grades with `defaults.chat`. */
    model?: string
    rubric?: Array<Record<string, unknown>>
    course_context?: string
    language_output?: string
    /**
     * The challenge this grade belongs to (camelCase UUID). **REQUIRED** since the BE
     * `CodeGradeController` grew a per-challenge AI-grade cap: it resolves the challenge before
     * spending a quota unit, so a missing / non-UUID value is rejected outright with 400
     * `AI_CODE_INVALID` ("Thiếu 'challengeId'"), and a challenge that is not CODING/SQL with the
     * same code. Typed non-optional on purpose — the caller that forgot it (SubjectPractice)
     * compiled fine while every grade it sent 400'd. When the challenge is a FREE "học thử" one
     * the cap is 1 grade per (challenge, user) → 429 `AI_FREE_CHALLENGE_GRADE_LIMIT`. The BE does
     * not forward this field onward to ftes-ai-service.
     */
    challengeId: string
}

/**
 * Body of `POST /api/v1/ai/coding/execute-code` — the in-browser sandbox run
 * (PIN §7.1, no LLM / no quota). `stdin` is fed to the program; `test_cases` is the
 * LEGACY Judge0 shape still sent by `SubjectPractice` and IGNORED by the Piston
 * sandbox — kept optional so both call sites type-check.
 */
export interface ExecuteCodeRequest {
    code: string
    language: string
    /** Program stdin for the run (new sandbox contract). */
    stdin?: string
    /** @deprecated Legacy Judge0 test-case run — the sandbox panel no longer sends it. */
    test_cases?: Array<CodeGradeTestCase>
    /**
     * The challenge this run belongs to (camelCase UUID). Optional. When the challenge is a
     * FREE "học thử" one the BE caps sandbox runs at 2 per (challenge, user) → 429
     * `AI_FREE_CHALLENGE_RUN_LIMIT`; non-free / omitted → unlimited (unchanged). Not forwarded
     * onward to ftes-ai-service.
     */
    challengeId?: string
}

/** One sandbox test-case run (objective — model-independent). */
export interface ExecutionCaseResult {
    input?: string
    expected?: string
    actual?: string
    /**
     * Mã trạng thái MÁY đọc: `OK` | `TIMEOUT` | `MEMORY` | `RUNTIME_ERROR` | `COMPILE_ERROR` |
     * `INFRA_ERROR`. Để HIỂN THỊ thì dùng {@link ExecutionCaseResult.status_label}.
     */
    status?: string
    /** Nhãn NGƯỜI đọc ("Accepted", "Time Limit Exceeded"…) — ưu tiên field này khi render. */
    status_label?: string
    passed?: boolean
    time?: number | string
    /**
     * Why the case died: compiler output, runtime trace, or the DB message for SQL
     * exercises (e.g. `Invalid object name 'sinh_vien'.`). The sandbox has always sent it;
     * without rendering it a Runtime Error is just an empty `actual` with nothing to fix.
     */
    stderr?: string
    /** Output bị cắt vì vượt trần (`output_max_bytes`). */
    truncated?: boolean
    /**
     * Case ẨN của đề (run-all-test-cases). Nút "Chạy test" nay chạy TOÀN BỘ bộ test phía server,
     * nên kết quả có cả case học viên không được đọc: với những dòng này server đã GỠ
     * `input`/`expected`/`actual`/`stderr` và thay `name` bằng nhãn vị trí.
     *
     * Cờ có mặt trên MỌI dòng (cả case mẫu, `false`) — suy "ẩn" từ việc thiếu `input` sẽ sai với
     * một case mẫu có input rỗng thật. Vắng cờ = backend cũ ⇒ mọi dòng đọc như case mẫu.
     */
    hidden?: boolean
    /** Nhãn của case — case ẩn nhận nhãn theo vị trí, không phải tên người soạn đề đặt. */
    name?: string
}

/** Sandbox execution block of a grade/execute response. */
export interface CodeExecutionSummary {
    results?: Array<ExecutionCaseResult>
    passed?: number
    total?: number
    /**
     * Lượt chạy bị DỪNG SỚM (hết ngân sách thời gian / quá nhiều case timeout liên tiếp) — các case
     * còn lại KHÔNG được chạy, nên "ít case hơn" không có nghĩa là đã chạy hết.
     */
    aborted?: boolean
    /** Lý do dừng sớm, vd `BUDGET_EXCEEDED` | `TOO_MANY_TIMEOUTS`. */
    abort_reason?: string
    /**
     * Bộ test bị TRẦN cắt bớt (run-all-test-cases) — khác `aborted` (dừng giữa chừng): ở đây phần
     * bị bỏ chưa từng được gửi đi chạy. Không nói ra thì "50/50 đạt" đọc như đã chạy hết đề.
     */
    truncated?: boolean
    /** Số case bị trần bỏ lại. */
    omitted?: number
}

/** One LLM-graded criterion row. */
export interface CodeGradeCriterion {
    name?: string
    score?: number
    max?: number
    comment?: string
}

/**
 * One GitHub-review-style change the agentic project grader flags on a file
 * (PIN §4 — `changes:[{file,line,reason,suggestion}]`). `file` is the project-relative
 * path (matches a `path` from the project tree), `line` is 1-based. Emitted only by the
 * agentic project grade (`POST /api/ai/v2/code/grade-project`); a plain code grade omits
 * `changes` entirely, so its presence is the "this is a project review" signal the result
 * view branches on.
 */
export interface CodeChange {
    /** Project-relative file path the comment anchors to (matches a tree `path`). */
    file: string
    /** 1-based line number the comment is pinned to. */
    line: number
    /** Why the line needs attention (the review comment body). */
    reason: string
    /** The concrete fix the grader suggests. */
    suggestion: string
    /**
     * The CURRENT line(s) the comment flags — the red "before" side of a display-only diff
     * (agentic-project-grader). camelCase, mirroring the BE `AiChangeView.oldCode` whitelist
     * record. Additive / backward-compatible: older graded submissions omit it, so the review
     * still renders reason + suggestion. Render the diff ONLY when BOTH `oldCode` and `newCode`
     * are present strings.
     */
    oldCode?: string
    /**
     * The SUGGESTED replacement for {@link oldCode} — the green "after" side of the diff
     * (BE `AiChangeView.newCode`). Additive; render the before/after block only when both
     * are present.
     */
    newCode?: string
}

/**
 * Response of `POST /api/v1/ai/coding/grade-code` (raw ftes-ai-service JSON).
 * `model` + `model_note` MUST be surfaced — each model grades differently.
 * `execution` is null for static-only languages (SQL).
 */
export interface CodeGradeResult {
    score?: number
    max?: number
    verdict?: string
    criteria?: Array<CodeGradeCriterion>
    feedback?: string
    improvements?: Array<string>
    model?: string
    model_note?: string
    execution?: CodeExecutionSummary | null
    /**
     * GitHub-review-style per-line change suggestions (PIN §4). Present ONLY on an
     * agentic project grade (`POST /api/ai/v2/code/grade-project`) — a plain code grade
     * omits it. An empty array means "graded, nothing to fix" (every file clean); its
     * presence (even empty) is how the attempts list decides to render the VS Code tree
     * review (`ProjectReviewResult`) instead of the flat `GradeResultCard`.
     */
    changes?: Array<CodeChange>
    /**
     * The project files the agentic grader actually opened during its tool-calling loop
     * (PIN §7 — the "trích đọc" the result view surfaces). Absent on a plain code grade.
     */
    files_read?: Array<string>
    /** How many agentic tool-calling rounds the grade took (PIN §7). Absent on a plain grade. */
    iterations?: number
    /**
     * Whether the submission is ON-TOPIC for the exercise (agentic grader relevance gate) —
     * camelCase, mirroring the BE `AiFeedbackView.relevance` whitelist record. `"OFF_TOPIC"`
     * means the submission does not address the problem, so the detailed per-line project
     * review is meaningless and the result view falls back to the flat score card. Additive /
     * backward-compatible: absent (older grades) OR `"RELATED"` MUST read as on-topic — never
     * hide the existing review on a missing value.
     */
    relevance?: "RELATED" | "OFF_TOPIC"
    /** Short human note on WHY the submission was judged off-topic (surfaced beside the note). Optional. */
    relevanceReason?: string
}

/**
 * Response of `POST /api/v1/ai/coding/execute-code`. The in-browser sandbox (PIN §7.1)
 * returns one program run's streams (`stdout`/`stderr`/`exit_code`/`time_ms`, plus
 * `compile_output` for compiled languages). `execution` is the LEGACY Judge0 test-case
 * block still read by `SubjectPractice` — both shapes coexist for backward compatibility.
 */
export interface CodeExecuteResult {
    stdout?: string
    stderr?: string
    exit_code?: number
    time_ms?: number
    compile_output?: string
    execution?: CodeExecutionSummary | null
}

/**
 * One SAMPLE (non-hidden) test case sent to `POST /api/v1/ai/coding/run-tests` — just the
 * learner-visible `input` + `expected`. HIDDEN cases are NEVER sent here; they stay
 * server-side for AI grading.
 */
export interface RunTestsCase {
    /**
     * Input fed to the program (stdin / args, per the exercise contract). For `language: "sql"`
     * there is no stdin — this carries EXTRA SQL run after `setupSql` to build the case's data
     * variant (e.g. a hidden case inserts one more row, then re-checks the learner's query).
     */
    input: string
    /** Expected output the program should produce. */
    expected: string
}

/**
 * Body of `POST /api/v1/ai/coding/run-tests` — runs the learner's code against a
 * challenge's SAMPLE test cases in the sandbox (no LLM, no AI quota; mirrors
 * {@link ExecuteCodeRequest}). The response reuses {@link CodeExecutionSummary}
 * (`results[]` + `passed`/`total`) — the same per-case shape a grade's Judge0 block
 * carries, so the FE renders it with one shared table.
 */
export interface RunTestsRequest {
    code: string
    language: string
    testCases: Array<RunTestsCase>
    /**
     * The challenge's seed dataset (DDL + INSERT), SQL exercises only — the same value threaded
     * into a plain Run as `setup_sql`. Each case is seeded fresh and rolled back after. Omitting
     * it runs the learner's query against an EMPTY database, so every case fails.
     */
    setupSql?: string
    /**
     * The challenge these sample-test runs belong to (camelCase UUID). Optional. Counts toward
     * the same FREE "học thử" run cap as {@link ExecuteCodeRequest.challengeId} (2 per
     * challenge/user → 429 `AI_FREE_CHALLENGE_RUN_LIMIT`); non-free / omitted → unlimited.
     */
    challengeId?: string
}

/**
 * Body of `POST /api/v1/ai/coding/execute-sql` — the Postgres sandbox run (PIN §7.2,
 * a single rolled-back transaction, no LLM / no quota). Field names are snake_case: the
 * BE proxies the body verbatim to ftes-ai-service (`/v2/code/execute-sql`).
 */
export interface SqlExecuteRequest {
    /** The learner's query (single statement; multi-statement is rejected BE-side). */
    query: string
    /** Optional setup DDL/seed run before the query in the same tx (rolled back after). */
    setup_sql?: string
    /** Cap on returned rows (BE clamps; default 500). */
    max_rows?: number
    /**
     * The challenge this SQL run belongs to (camelCase UUID). Optional. Counts toward the same
     * FREE "học thử" run cap as {@link ExecuteCodeRequest.challengeId} (2 per challenge/user →
     * 429 `AI_FREE_CHALLENGE_RUN_LIMIT`); non-free / omitted → unlimited.
     */
    challengeId?: string
}

/**
 * Response of `POST /api/v1/ai/coding/execute-sql` (PIN §7.2). Cells are stringified
 * BE-side, so `rows` is a grid of strings addressed positionally by `columns`. A
 * non-null `error` carries a scrubbed message for a syntax/timeout failure — render it
 * instead of the grid, never a stacktrace.
 */
export interface SqlRunResult {
    columns: Array<string>
    rows: Array<Array<string>>
    row_count: number
    error?: string | null
    truncated: boolean
    time_ms: number
}

/**
 * Body of `POST /api/v1/ai/coding/sql-schema` — introspection of a SQL challenge's seed
 * dataset (PIN §4C). Unlike execute-sql, the field is camelCase (`setupSql`): the BE
 * proxies it to ftes-ai-service `/v2/code/sql-schema {setup_sql}`.
 */
export interface SqlSchemaRequest {
    /** The mentor's seed DDL/DML — run in a rolled-back tx, then introspected for the schema. */
    setupSql: string
}

/** One column of an introspected SQL table (PIN §4C). */
export interface SqlSchemaColumn {
    /** Column name. */
    name: string
    /** SQL data type (e.g. `integer`, `character varying`). */
    dataType: string
    /** Whether the column accepts NULL. */
    nullable: boolean
    /** Whether the column is part of the table's primary key. */
    isPrimaryKey: boolean
}

/** One foreign-key relationship declared on an introspected SQL table (PIN §4C). */
export interface SqlSchemaForeignKey {
    /** The referencing column on this table. */
    column: string
    /** The referenced table. */
    refTable: string
    /** The referenced column. */
    refColumn: string
}

/** One introspected SQL table — its columns and foreign keys (PIN §4C). */
export interface SqlSchemaTable {
    /** Table name. */
    name: string
    /** Ordered columns. */
    columns: Array<SqlSchemaColumn>
    /** Foreign-key relationships declared on this table. */
    foreignKeys: Array<SqlSchemaForeignKey>
}

/**
 * Response of `POST /api/v1/ai/coding/sql-schema` (PIN §4C) — the introspected schema of
 * a challenge's seed dataset, so a learner sees the tables/columns/relationships they can
 * query. `tables` is empty when the seed creates nothing. Engine unconfigured BE-side →
 * 503 `AI_SQL_UNAVAILABLE` (surfaced as an error, never a crash).
 */
export interface SqlSchema {
    tables: Array<SqlSchemaTable>
}

// ---------------- StudyPlanController (/api/v1/ai/learning/study-plan[s]) ----------------

/**
 * One task inside a study-plan week. Field names are snake_case — the `plan` jsonb
 * is passed through verbatim from ftes-ai-service (see BE `StudyPlanView.plan`).
 */
export interface StudyPlanTask {
    title?: string
    est_hours?: number
    resource_hint?: string | null
}

/** One week of a generated study plan (`plan.weeks[]`). */
export interface StudyPlanWeek {
    /** 1-based week number — the `w{week}` half of a task key. */
    week: number
    focus?: string
    milestone?: string
    tasks?: Array<StudyPlanTask>
}

/** The generated plan body (`plan` jsonb). */
export interface StudyPlanContent {
    weeks?: Array<StudyPlanWeek>
    tips?: Array<string>
}

/** The creation input echoed back on a plan (`input` jsonb). */
export interface StudyPlanInput {
    goal?: string
    deadlineDays?: number
    hoursPerWeek?: number
    currentLevel?: string
    knownTopics?: Array<string>
    targetTopics?: Array<string>
    language?: string
}

/** Progress record (`progress` jsonb) — the list of checked-off task keys. */
export interface StudyPlanProgress {
    /** Done task keys, each `w{week}:{index}`. */
    done?: Array<string>
}

/**
 * A study plan row (`StudyPlanView`). `input` / `plan` / `progress` are jsonb blobs;
 * `percentDone` is computed BE-side (`|done ∩ valid task keys| / total`, 0..100).
 * `status` is `ACTIVE` or `ARCHIVED`.
 */
export interface StudyPlanView {
    id: string
    goal: string
    input?: StudyPlanInput | null
    plan?: StudyPlanContent | null
    progress?: StudyPlanProgress | null
    modelUsed?: string
    status: string
    createdAt?: string
    updatedAt?: string
    percentDone: number
}

/**
 * Body of `POST /api/v1/ai/learning/study-plan`. Only `goal` is required; the BE
 * defaults the rest (`deadlineDays` 28, `hoursPerWeek` 8, `language` "vi").
 */
export interface CreateStudyPlanRequest {
    goal: string
    deadlineDays?: number
    hoursPerWeek?: number
    currentLevel?: string
    knownTopics?: Array<string>
    targetTopics?: Array<string>
    language?: string
    /** Optional catalog model id; omit → BE picks the configured default. */
    model?: string
}

/**
 * Body of `PATCH /api/v1/ai/learning/study-plans/{id}/progress`. `taskKey` must
 * exist in the saved plan (`w{week}:{index}`); `done` toggles it (idempotent).
 */
export interface StudyPlanProgressRequest {
    taskKey: string
    done: boolean
}

// ---------------- DocumentQaController (POST /api/v1/ai/document-qa) ----------------

/**
 * Body of `POST /api/v1/ai/document-qa` (BE `DocumentQaController.DocumentQaRequest`).
 * `document_ref` BE-side = `documentId ?? lessonId` — send at least one of them.
 * `selection` is the highlighted passage ("bôi đen hỏi AI"); `model` must be on the
 * catalog allowlist (invalid → 400 before any quota is spent).
 */
export interface DocumentQaRequest {
    documentId?: string
    lessonId?: string
    selection?: string
    question: string
    /** Catalog model id; omit → BE resolves (image mime → vision default, else DOCUMENT_QA config). */
    model?: string
}

/**
 * One citation of a document-QA answer (snake_case — passed through verbatim from
 * ftes-ai-service `Citation`). `quote` is clamped BE-side to ≤200 chars.
 */
export interface DocumentQaCitation {
    document_ref?: string | null
    page?: number | null
    chunk_index?: number | null
    quote: string
}

/**
 * Response of `POST /api/v1/ai/document-qa` — raw ftes-ai-service JSON passed through
 * (`{answer, citations[], model}`). A document not yet indexed/OCR'd answers softly with
 * `{answer: "", processing: true}` → show "Đang xử lý tài liệu…" instead of a hard error.
 */
export interface DocumentQaResponse {
    answer: string
    citations?: Array<DocumentQaCitation>
    model?: string
    /** True while the document is still being indexed/OCR'd (quota refunded). */
    processing?: boolean
}
