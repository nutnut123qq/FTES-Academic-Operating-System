import type { GraphQLResponse } from "../../types"
import type { AiModelCategory } from "../../queries/query-ai-models"

/**
 * AI surface (hạng mục) a per-feature model ceiling applies to. Mirrors backend
 * `AiCeilSurface`. Omit `surface` in the request to set the global default.
 */
export enum AiCeilSurface {
    /** Hỏi AI khi đọc bài (lesson tutor). */
    Chatbot = "chatbot",
    /** Chấm bài (challenge + capstone). */
    Grading = "grading",
    /** Phỏng vấn thử (mock interview). */
    Interview = "interview",
}

/** GraphQL `SetAiCeilRequest` body. */
export interface SetAiCeilRequest {
    /** Surface to cap; omit/null to set the global default. */
    surface?: AiCeilSurface | null
    /** Ceiling category; null/omit to clear (uncap → plan ceiling only). */
    category?: AiModelCategory | null
}

/** Apollo response shape for `setAiCeil` (no data — refetch myAiQuota). */
export interface MutateSetAiCeilResponse {
    /** Top-level `setAiCeil` field wrapping the standard API response. */
    setAiCeil: GraphQLResponse<null>
}
