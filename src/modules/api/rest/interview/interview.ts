import { restRequest } from "@/modules/api/rest/client"
import type {
    FinishAttemptView,
    InterviewTemplateView,
    StartAttemptRequest,
    StartAttemptView,
    SubmitAnswerParams,
    SubmitAnswerRequest,
    SubmitAnswerView,
} from "./types"

const BASE = "/ai/interview"

// ---------------- reads ----------------

/** Fetch the course interview template and current question set (student view). */
export const getInterviewTemplate = async (courseRef: string): Promise<InterviewTemplateView> =>
    restRequest<InterviewTemplateView>({
        method: "GET",
        url: `${BASE}/templates/${courseRef}`,
        authenticated: true,
    })

// ---------------- writes ----------------

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
