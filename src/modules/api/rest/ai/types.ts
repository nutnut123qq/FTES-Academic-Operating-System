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

// ---------------- ModelsController (GET /api/v1/ai/models) ----------------

/** One selectable model from the ftes-ai-service catalog. */
export interface AiCatalogModel {
    id: string
    label?: string
    provider?: string
    vision?: boolean
    pricing_hint?: string
}

/**
 * Model catalog proxied verbatim from ftes-ai-service `GET /v2/models` —
 * `{models[], defaults{chat,…}}`. `defaults.chat` is the model the BE grades
 * with when the request carries no explicit `model`.
 */
export interface AiModelCatalog {
    models?: Array<AiCatalogModel>
    defaults?: Record<string, string>
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
}

/** Body of `POST /api/v1/ai/coding/execute-code` (Judge0 only, no LLM). */
export interface ExecuteCodeRequest {
    code: string
    language: string
    test_cases?: Array<CodeGradeTestCase>
}

/** One Judge0 test-case run (objective — model-independent). */
export interface ExecutionCaseResult {
    input?: string
    expected?: string
    actual?: string
    status?: string
    passed?: boolean
    time?: number | string
}

/** Judge0 execution block of a grade/execute response. */
export interface CodeExecutionSummary {
    results?: Array<ExecutionCaseResult>
    passed?: number
    total?: number
}

/** One LLM-graded criterion row. */
export interface CodeGradeCriterion {
    name?: string
    score?: number
    max?: number
    comment?: string
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
}

/** Response of `POST /api/v1/ai/coding/execute-code`. */
export interface CodeExecuteResult {
    execution?: CodeExecutionSummary | null
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
