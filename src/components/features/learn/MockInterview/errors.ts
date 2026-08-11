import { RestError } from "@/modules/api/rest/client"

/**
 * True when a mock-interview call failed because the AI side is unavailable rather than
 * because of anything the learner did — so the UI can show a "come back later" notice
 * instead of a generic "please try again".
 *
 * Covers the shapes the backend emits: `MOCK_INTERVIEW_AI_UNAVAILABLE` (503, the draw path —
 * every ftes-ai-service failure, including an empty response, now surfaces under this code),
 * `AI_CONTENT_DOWN` (503, ftes-ai-service missing / unreachable — `FtesAiContentClient`) and
 * `AI_PROVIDER_UNAVAILABLE` (502, the grade call blew up inside the provider —
 * `MockInterviewGradingService`). The bare status check is the safety net for a gateway
 * 502/503 that never reaches the domain error mapper.
 *
 * `MOCK_INTERVIEW_INVALID_PAYLOAD` (400) is deliberately NOT here. It used to double as the
 * AI-failure code, so this UI had to guess; the backend split the two, so a 400 now means
 * exactly what it says — the caller sent bad parameters — and must not be dressed up as an
 * outage the learner should wait out.
 */
export const isAiDownError = (error: unknown): boolean => {
    if (!(error instanceof RestError)) {
        return false
    }
    return (
        error.status === 502 ||
        error.status === 503 ||
        error.errorCode === "MOCK_INTERVIEW_AI_UNAVAILABLE" ||
        error.errorCode === "AI_CONTENT_DOWN" ||
        error.errorCode === "AI_PROVIDER_UNAVAILABLE"
    )
}
