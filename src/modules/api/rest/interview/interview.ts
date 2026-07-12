import { restRequest } from "@/modules/api/rest/client"
import type {
    FinishAttemptView,
    GenerateInterviewTemplateRequest,
    GenerateInterviewTemplateView,
    InterviewTemplateFullView,
    StartAttemptRequest,
    StartAttemptView,
    SubmitAnswerParams,
    SubmitAnswerRequest,
    SubmitAnswerView,
} from "./types"

const BASE = "/ai/interview"

// ---------------- reads ----------------

/**
 * Fetch the course interview template and current question set.
 * The backend returns a stripped student view or a full lecturer view depending
 * on the caller's permissions; the FE type keeps all fields optional so both
 * shapes degrade gracefully.
 */
export const getInterviewTemplate = async (courseRef: string): Promise<InterviewTemplateFullView> =>
    restRequest<InterviewTemplateFullView>({
        method: "GET",
        url: `${BASE}/templates/${courseRef}`,
        authenticated: true,
    })

// ---------------- writes ----------------

/**
 * Generate a new interview template + question set for a course.
 * Requires `ai.teacher.use` and lecturer-of-course permissions on the backend.
 */
export const generateInterviewTemplate = async (
    request: GenerateInterviewTemplateRequest,
): Promise<GenerateInterviewTemplateView> =>
    restRequest<GenerateInterviewTemplateView>({
        method: "POST",
        url: `${BASE}/templates`,
        data: request,
    })

/** Start a new attempt for the given question set. */
export const startInterviewAttempt = async (request: StartAttemptRequest): Promise<StartAttemptView> =>
    restRequest<StartAttemptView>({
        method: "POST",
        url: `${BASE}/attempts`,
        data: request,
    })

/** Submit (and persist) one answer. */
export const submitInterviewAnswer = async (
    attemptId: string,
    request: SubmitAnswerRequest,
): Promise<SubmitAnswerView> =>
    restRequest<SubmitAnswerView>({
        method: "POST",
        url: `${BASE}/attempts/${attemptId}/answers`,
        data: request,
    })

/** Finish the attempt and receive the final scorecard. */
export const finishInterviewAttempt = async (attemptId: string): Promise<FinishAttemptView> =>
    restRequest<FinishAttemptView>({
        method: "POST",
        url: `${BASE}/attempts/${attemptId}/finish`,
        data: {},
    })

/** Convenience wrapper that accepts the same arg bag the SWR mutation uses. */
export const submitInterviewAnswerFromParams = async ({
    attemptId,
    request,
}: SubmitAnswerParams): Promise<SubmitAnswerView> => submitInterviewAnswer(attemptId, request)
