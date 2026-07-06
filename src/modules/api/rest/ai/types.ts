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
