import type { GraphQLResponse } from "../../types"
import type {
    AiMode,
    AiSubTier,
} from "../query-my-ai-settings"
import type { AiModelCategory } from "../query-ai-models"

/** Per-surface model ceiling the user set (null = inherit default / no cap). */
export interface QueryMyAiCeilData {
    /** Global default ceiling; null = no cap (plan ceiling only). */
    default: AiModelCategory | null
    /** Hỏi AI khi đọc bài override; null = follow default. */
    chatbot: AiModelCategory | null
    /** Chấm bài override; null = follow default. */
    grading: AiModelCategory | null
    /** Phỏng vấn thử override; null = follow default. */
    interview: AiModelCategory | null
}

/** Per-window unified platform credit quota (free base + tier). */
export interface QueryMyAiCreditQuotaData {
    /** Credit allowance in the 5h window (free base + tier). */
    limit5h: number
    /** Credits consumed in the current 5h window. */
    used5h: number
    /** Remaining credits in the 5h window. */
    remaining5h: number
    /** Credit allowance in the weekly window (free base + tier). */
    limitWeek: number
    /** Credits consumed in the current weekly window. */
    usedWeek: number
    /** Remaining credits in the weekly window. */
    remainingWeek: number
}

/** Payload inside `myAiQuota.data` after the standard API wrapper. */
export interface QueryMyAiQuotaResponseData {
    /** Natural lane the user is on right now. */
    mode: AiMode
    /** Active paid tier, or null on the free lane. */
    tier: AiSubTier | null
    /** Unified platform credit quota (free base + tier). */
    credit: QueryMyAiCreditQuotaData
    /** When the 5h window rolls over (counters reset); null when not started. */
    window5hResetAt: string | null
    /** When the weekly window rolls over; null when not started. */
    windowWeekResetAt: string | null
    /** Categories the user's plan unlocks — the ceiling to cap within. */
    allowedCategories: Array<AiModelCategory>
    /** Per-surface model ceiling the user set (cost control). */
    ceil: QueryMyAiCeilData
}

/** Apollo response shape for the `myAiQuota` query. */
export interface QueryMyAiQuotaResponse {
    /** Top-level `myAiQuota` field wrapping the standard API response. */
    myAiQuota: GraphQLResponse<QueryMyAiQuotaResponseData>
}
