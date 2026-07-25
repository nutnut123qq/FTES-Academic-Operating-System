import { restRequest } from "@/modules/api/rest/client"
import type { MessageView } from "@/modules/api/rest/ai"

/**
 * Full transcript of ONE owned AI chat session —
 * `GET /api/v1/ai/sessions/{id}/messages` (BE `SessionController.messages`).
 *
 * Owner-scoped: a session belonging to somebody else answers `404
 * AI_SESSION_NOT_FOUND`. Rows come back oldest-first with `role` upper-cased
 * (`USER` / `ASSISTANT`).
 *
 * NOTE: this reader lives feature-local only because the shared
 * `@/modules/api/rest/ai` client does not expose one yet (it only has
 * `getSession` + the SSE writer). Move it into that module — unchanged
 * signature — the next time the shared AI client is edited.
 */
export const getAiSessionMessages = async (
    sessionId: string,
): Promise<Array<MessageView>> =>
    restRequest<Array<MessageView>>({
        method: "GET",
        url: `/ai/sessions/${sessionId}/messages`,
        authenticated: true,
    })
