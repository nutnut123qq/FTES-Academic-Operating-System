import { restRequest } from "@/modules/api/rest/client"
import type {
    AiInsights,
    CareerSuggestionView,
    CreateSessionRequest,
    JobRef,
    JobView,
    ModelConfigView,
    AiSessionView,
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
