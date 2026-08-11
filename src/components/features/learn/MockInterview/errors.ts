import { RestError } from "@/modules/api/rest/client"

/**
 * True when a mock-interview call failed because the AI side is unavailable rather than
 * because of anything the learner did — so the UI can show a "come back later" notice
 * instead of a generic "please try again".
 *
 * Covers both shapes the backend emits: `AI_CONTENT_DOWN` (503, ftes-ai-service missing /
 * unreachable — `FtesAiContentClient`) and `AI_PROVIDER_UNAVAILABLE` (502, the grade call
 * blew up inside the provider — `MockInterviewGradingService`). The bare status check is the
 * safety net for a gateway 502/503 that never reaches the domain error mapper.
 */
export const isAiDownError = (error: unknown): boolean => {
    if (!(error instanceof RestError)) {
        return false
    }
    return (
        error.status === 502 ||
        error.status === 503 ||
        error.errorCode === "AI_CONTENT_DOWN" ||
        error.errorCode === "AI_PROVIDER_UNAVAILABLE"
    )
}
